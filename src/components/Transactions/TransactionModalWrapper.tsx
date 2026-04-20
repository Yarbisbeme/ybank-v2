import { Suspense } from 'react';
import { createSupabaseClient } from '@/lib/supabase/createServerClient';
import TransactionModal from './TransactionModal';

export default async function TransactionModalWrapper() {
  // 1. Iniciamos Supabase
  const supabase = await createSupabaseClient();
  
  // 2. Traemos TODA la data fresca
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*, institution:institutions(*)');
    
  const { data: tags } = await supabase
    .from('tags')
    .select('*');

  // 💡 3. ESTA ES LA CONSULTA QUE FALTABA PARA LAS CATEGORÍAS
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true }); // Las ordenamos alfabéticamente para que se vean mejor

  // 4. Retornamos el Modal pasándole absolutamente todo
  return (
    <Suspense fallback={null}>
      <TransactionModal 
        accounts={accounts || []} 
        tags={tags || []} 
        categories={categories || []} // 💡 AHORA SÍ VIAJAN AL MODAL
      />
    </Suspense>
  );
}