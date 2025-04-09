
// Validation functions for request data
export function validateRequest(requestBody: any) {
  const { email, redirectUrl } = requestBody;
  
  if (!email || typeof email !== 'string') {
    console.error("Email invalide ou manquant dans la requête");
    return { 
      isValid: false, 
      error: "Email invalide ou manquant", 
      status: 400 
    };
  }

  if (!redirectUrl || typeof redirectUrl !== 'string') {
    console.error("URL de redirection invalide ou manquante");
    return { 
      isValid: false, 
      error: "URL de redirection invalide ou manquante", 
      status: 400 
    };
  }

  return { isValid: true };
}
