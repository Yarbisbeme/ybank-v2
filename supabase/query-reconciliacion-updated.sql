DO $$

DECLARE
    -- Variables iniciales de n8n
    var_tx_type text := '{{ $("Code in JavaScript").item.json.transaction_type }}';
    var_user_id uuid := '{{ $("Code in JavaScript").item.json.user_id }}';
    var_src_curr text := '{{ $("Code in JavaScript").item.json.source_currency }}';
    var_tgt_curr text := '{{ $("Code in JavaScript").item.json.target_currency }}';
    var_bank text := '{{ $("Code in JavaScript").item.json.detected_bank }}';
    var_status text := '{{ $("Code in JavaScript").item.json.status }}';

    var_date text := '{{ $("Code in JavaScript").item.json.date }}';
    var_time text := NULLIF('{{ $("Code in JavaScript2").item.json.time }}', 'null');
    var_full_timestamp text;

    var_raw_src_digits text := NULLIF(NULLIF('{{ $("Code in JavaScript").item.json.source_account_last_4 }}', 'null'), 'undefined');
    var_raw_card_digits text := NULLIF(NULLIF('{{ $("Code in JavaScript").item.json.card_last_4_digits }}', 'null'), 'undefined');
    var_raw_tgt_digits text := NULLIF(NULLIF('{{ $("Code in JavaScript").item.json.target_account_last_4 }}', 'null'), 'undefined');

    var_src_type text := NULLIF(NULLIF('{{ $("Code in JavaScript").item.json.source_account_type }}', 'null'), 'undefined');
    var_tgt_type text := NULLIF(NULLIF('{{ $("Code in JavaScript").item.json.target_account_type }}', 'null'), 'undefined');

    var_is_third_party boolean := CAST(NULLIF('{{ $("Code in JavaScript").item.json.is_third_party }}', '') AS boolean);

    var_src_digits text;
    var_tgt_digits text;

    v_source_id uuid;
    v_target_id uuid;
    v_existing_id uuid;
    v_existing_type text;

    v_inst_id uuid;
    v_inst_color text;
    v_inst_pattern text;
    v_inst_theme text;

BEGIN

    -- ==========================================
    -- ESCUDO ANTI-INFORMATIVOS (EARLY EXIT)
    -- ==========================================
    IF var_status = 'ignored' OR var_status = 'error' THEN
        RETURN;
    END IF;

    var_full_timestamp := var_date || ' ' || COALESCE(var_time, '00:00:00');

    PERFORM pg_advisory_xact_lock(hashtext(var_user_id::text));

    -- ==========================================
    -- SANITY CHECK: CORRECCIÓN DE DIRECCIÓN
    -- ==========================================
    IF var_tx_type IN ('expense', 'income') OR var_is_third_party = true THEN
        var_src_digits := COALESCE(var_raw_src_digits, var_raw_card_digits);
        var_tgt_digits := NULL;

        IF var_tx_type = 'income' AND var_tgt_type IS NOT NULL THEN
            var_src_type := var_tgt_type;
        END IF;

        IF var_src_digits IS NULL AND var_raw_tgt_digits IS NOT NULL THEN
            var_src_digits := var_raw_tgt_digits;
        END IF;
    ELSE
        var_src_digits := COALESCE(var_raw_src_digits, var_raw_card_digits);
        var_tgt_digits := var_raw_tgt_digits;
    END IF;

    -- ==========================================
    -- 0. BÚSQUEDA DE INSTITUCIÓN
    -- ==========================================
    SELECT id, brand_color_primary, card_pattern, text_theme
    INTO v_inst_id, v_inst_color, v_inst_pattern, v_inst_theme
    FROM public.institutions
    WHERE name ILIKE '%' || var_bank || '%'
       OR var_bank ILIKE '%' || name || '%'
    LIMIT 1;

    IF v_inst_id IS NULL THEN
        v_inst_color := '#0f172a';
        v_inst_pattern := 'geometric';
        v_inst_theme := 'light';
    END IF;

    -- ==========================================
    -- 1. BÚSQUEDA DE LA CUENTA PRINCIPAL
    -- ==========================================
    -- Primero buscar por last_4_digits
    IF var_src_digits IS NOT NULL THEN
        SELECT id INTO v_source_id FROM public.accounts
        WHERE user_id = var_user_id
          AND last_4_digits = var_src_digits
          AND currency = var_src_curr::currency_code
        LIMIT 1;
    END IF;

    -- FIX 3: Si no se encontro por last_4, buscar por nombre de banco
    -- (evita auto-crear cuenta con last_4 del destinatario)
    IF v_source_id IS NULL THEN
        SELECT id INTO v_source_id FROM public.accounts
        WHERE user_id = var_user_id
          AND (name ILIKE '%' || var_bank || '%' OR var_bank ILIKE '%' || name || '%')
          AND currency = var_src_curr::currency_code
          AND is_active = true
        LIMIT 1;
    END IF;

    -- ==========================================
    -- 2. BÚSQUEDA DEL DESTINO (Solo Transfers Internos)
    -- ==========================================
    IF var_tgt_digits IS NOT NULL AND var_tx_type NOT IN ('expense', 'income') AND var_is_third_party = false THEN
        SELECT id INTO v_target_id FROM public.accounts
        WHERE user_id = var_user_id
          AND last_4_digits = var_tgt_digits
          AND currency = var_tgt_curr::currency_code
        LIMIT 1;
    END IF;

    -- ==========================================
    -- 3. AUTO-CREACIÓN DE CUENTAS FALTANTES
    -- ==========================================
    IF v_source_id IS NULL THEN
        INSERT INTO public.accounts (
            user_id, institution_id, name, type, currency, last_4_digits,
            initial_balance, current_balance, is_active,
            color, custom_pattern, custom_text_theme
        ) VALUES (
            var_user_id, v_inst_id,
            (CASE COALESCE(NULLIF(var_src_type, ''), 'savings')
                WHEN 'savings' THEN 'Ahorros '
                WHEN 'checking' THEN 'Corriente '
                WHEN 'credit_card' THEN 'TC '
                ELSE 'Cuenta '
            END) || COALESCE(NULLIF(var_bank, ''), 'General'),
            COALESCE(NULLIF(var_src_type, ''), 'savings')::account_type,
            COALESCE(NULLIF(var_src_curr, ''), 'DOP')::currency_code,
            var_src_digits, 0, 0, true,
            v_inst_color,
            v_inst_pattern::custom_pattern,
            v_inst_theme::custom_text_theme
        ) RETURNING id INTO v_source_id;
    END IF;

    IF v_target_id IS NULL AND var_tgt_digits IS NOT NULL AND var_tx_type IN ('transfer', 'payment') THEN
        INSERT INTO public.accounts (
            user_id, institution_id, name, type, currency, last_4_digits,
            initial_balance, current_balance, is_active,
            color, custom_pattern, custom_text_theme
        ) VALUES (
            var_user_id, v_inst_id,
            (CASE COALESCE(NULLIF(var_tgt_type, ''), 'credit_card')
                WHEN 'savings' THEN 'Ahorros '
                WHEN 'checking' THEN 'Corriente '
                WHEN 'credit_card' THEN 'TC '
                ELSE 'Cuenta '
            END) || COALESCE(NULLIF(var_bank, ''), 'General'),
            COALESCE(NULLIF(var_tgt_type, ''), 'credit_card')::account_type,
            COALESCE(NULLIF(var_tgt_curr, ''), 'DOP')::currency_code,
            var_tgt_digits, 0, 0, true,
            v_inst_color,
            v_inst_pattern::custom_pattern,
            v_inst_theme::custom_text_theme
        ) RETURNING id INTO v_target_id;
    END IF;

    -- ==========================================
    -- 4. INSERCIÓN O ACTUALIZACIÓN DE TRANSACCIÓN
    -- ==========================================
    -- Buscar pending_match O completed sin transfer_to_account_id (mismo match_key)
    -- Esto permite reconciliar cuando el segundo correo llega después del primero
    SELECT id, type INTO v_existing_id, v_existing_type FROM public.transactions
    WHERE match_key = '{{ $("Code in JavaScript").item.json.match_key }}'
      AND user_id = var_user_id
      AND (
        status = 'pending_match'::transaction_status
        OR (status = 'completed'::transaction_status
            AND transfer_to_account_id IS NULL
            AND type IN ('transfer', 'income'))
      )
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- MATCH ENCONTRADO: Actualizar transacción existente
        UPDATE public.transactions
        SET
            transfer_to_account_id = CASE
                WHEN v_target_id IS NOT NULL AND v_target_id != v_source_id THEN v_target_id
                ELSE transfer_to_account_id
            END,
            -- Si el existente es income y el nuevo es transfer (o viceversa), corregir el tipo
            type = CASE
                WHEN v_existing_type = 'income' AND var_tx_type = 'transfer' THEN var_tx_type::transaction_type
                WHEN v_existing_type = 'transfer' AND var_tx_type = 'income' THEN var_tx_type::transaction_type
                ELSE type
            END,
            status = 'completed'::transaction_status,
            match_key = NULL,
            description = description || ' -> Recibido en ' || var_bank
        WHERE id = v_existing_id;
    ELSE
        -- NO HAY MATCH: Insertar nueva transacción
        IF v_source_id = v_target_id THEN
            v_target_id := NULL;
        END IF;

        INSERT INTO public.transactions (
            user_id, account_id, transfer_to_account_id, category_id, type, amount,
            description, date, source_email_id, status, match_key
        ) VALUES (
            var_user_id, v_source_id, v_target_id,
            NULLIF('{{ $("Code in JavaScript").item.json.category_id }}', '')::uuid,
            var_tx_type::transaction_type,
            {{ $("Code in JavaScript").item.json.amount }},
            '{{ $("Code in JavaScript").item.json.description }}',
            CAST(var_full_timestamp AS TIMESTAMPTZ),
            '{{ $("Code in JavaScript").item.json.id }}',
            var_status::transaction_status,
            -- FIX 4: Solo conservar match_key si es income/transfer pendiente
            CASE
                WHEN var_status = 'pending_match' THEN '{{ $("Code in JavaScript").item.json.match_key }}'
                ELSE NULL
            END
        ) ON CONFLICT (source_email_id) DO NOTHING;
    END IF;

    -- ==========================================
    -- 5. INSERCIÓN DE SUB-TRANSACCIÓN (COMISIÓN 100 DOP)
    -- ==========================================
    DECLARE
        v_desc_text text := '{{ $("Code in JavaScript").item.json.description }}';
    BEGIN
        IF (var_bank ILIKE '%PayPal%'
            OR v_desc_text ILIKE '%instantanea%'
            OR v_desc_text ILIKE '%instantánea%')
           AND v_existing_id IS NULL AND var_status != 'ignored' THEN

            INSERT INTO public.transactions (
                user_id, account_id, transfer_to_account_id, category_id, type, amount,
                description, date, source_email_id, status, match_key
            ) VALUES (
                var_user_id,
                COALESCE(v_target_id, v_source_id),
                NULL,
                '668ac616-4abf-4472-a7e9-98fe20d90133'::uuid,
                'expense'::transaction_type,
                100.00,
                CASE
                    WHEN var_bank ILIKE '%PayPal%' THEN 'Comisión de Retiro (PayPal)'
                    ELSE 'Comisión por Transferencia Instantánea'
                END,
                CAST(var_full_timestamp AS TIMESTAMPTZ),
                '{{ $("Code in JavaScript").item.json.id }}' || '-100-fee',
                'completed'::transaction_status,
                '{{ $("Code in JavaScript").item.json.match_key }}' || '-100-fee'
            ) ON CONFLICT (source_email_id) DO NOTHING;
        END IF;
    END;

END $$;
