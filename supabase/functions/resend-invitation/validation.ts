
// Valider la requête entrante
export function validateRequest(body: any) {
  // Vérifier que la requête contient un email
  if (!body || !body.email) {
    console.error("Validation: Email manquant dans la requête");
    return {
      isValid: false,
      error: "L'email est requis",
      status: 400
    };
  }

  // Vérifier que l'email est une chaîne de caractères valide
  if (typeof body.email !== 'string' || !body.email.includes('@')) {
    console.error(`Validation: Format d'email invalide: ${body.email}`);
    return {
      isValid: false,
      error: `Format d'email invalide: ${body.email}`,
      status: 400
    };
  }

  // Vérifier que l'URL de redirection est présente
  if (!body.redirectUrl) {
    console.error("Validation: URL de redirection manquante");
    return {
      isValid: false,
      error: "L'URL de redirection est requise",
      status: 400
    };
  }

  // Valider les options d'invitation si présentes
  if (body.inviteOptions) {
    if (typeof body.inviteOptions !== 'object') {
      return {
        isValid: false,
        error: "Le format des options d'invitation est invalide",
        status: 400
      };
    }

    // Vérifier que les valeurs sont des types attendus
    if ('expireIn' in body.inviteOptions && typeof body.inviteOptions.expireIn !== 'number') {
      return {
        isValid: false,
        error: "Le délai d'expiration doit être un nombre",
        status: 400
      };
    }
  }

  console.log("Validation: Requête valide pour l'email:", body.email);
  return { isValid: true };
}
