describe('Iniciar sesion sin permisos', () => {
  
  beforeEach(() => {
    cy.visit('http://youtube.com');
  });

  it('Debemos de inciar sesion con las credenciales', () => {

    cy.get('#Sign-Up').click();
    
  });
});
