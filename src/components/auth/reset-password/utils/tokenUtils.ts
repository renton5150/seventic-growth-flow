
/**
 * Utility functions for handling authentication tokens from URLs
 */

export interface TokenParams {
  accessToken: string | null;
  refreshToken: string | null;
  typeParam: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

/**
 * Extracts authentication tokens and parameters from URL hash
 */
export const extractHashParams = (hashString: string): TokenParams => {
  console.log("Analyse du hash URL");
  
  // Enlever le # du début si présent
  const cleanHashString = hashString.startsWith('#') 
    ? hashString.substring(1) 
    : hashString;
  
  // Créer un objet avec les paires clé=valeur
  const hashParams: Record<string, string> = {};
  cleanHashString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      hashParams[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  
  console.log("Hash params:", hashParams);
  
  return {
    accessToken: hashParams['access_token'] || null,
    refreshToken: hashParams['refresh_token'] || null,
    typeParam: hashParams['type'] || null,
    errorCode: hashParams['error'] || null,
    errorDescription: hashParams['error_description'] || null
  };
};

/**
 * Extracts authentication tokens and parameters from URL query parameters
 */
export const extractQueryParams = (searchString: string): TokenParams => {
  console.log("Recherche dans les query params");
  const queryParams = new URLSearchParams(searchString);
  
  return {
    accessToken: queryParams.get("access_token"),
    refreshToken: queryParams.get("refresh_token"),
    typeParam: queryParams.get("type"),
    errorCode: queryParams.get("error"),
    errorDescription: queryParams.get("error_description")
  };
};

/**
 * Determines the reset password mode based on the type parameter
 */
export const determineResetMode = (typeParam: string | null): "reset" | "setup" => {
  if (typeParam === "signup" || typeParam === "invite") {
    console.log(`Mode setup détecté (type=${typeParam})`);
    return "setup";
  } else if (typeParam === "recovery") {
    console.log(`Mode reset détecté (type=${typeParam})`);
    return "reset";
  }
  
  // Par défaut
  return "reset";
};

/**
 * Extracts all auth tokens from URL (hash and query params)
 */
export const extractAuthTokens = (location: { hash: string, search: string }): TokenParams => {
  console.log("Extraction des tokens d'authentification de l'URL");
  
  // Variables pour stocker les tokens et les paramètres
  let params: TokenParams = {
    accessToken: null,
    refreshToken: null,
    typeParam: null,
    errorCode: null,
    errorDescription: null
  };
  
  // Extraction des paramètres du hash (prioritaire)
  if (location.hash) {
    const hashParams = extractHashParams(location.hash);
    params = { ...params, ...hashParams };
  }
  
  // Si on n'a pas trouvé de tokens dans le hash, vérifier les query params
  if (!params.accessToken) {
    const queryParams = extractQueryParams(location.search);
    
    // Combiner les résultats, en donnant la priorité aux valeurs non nulles déjà trouvées
    params = {
      accessToken: params.accessToken || queryParams.accessToken,
      refreshToken: params.refreshToken || queryParams.refreshToken,
      typeParam: params.typeParam || queryParams.typeParam,
      errorCode: params.errorCode || queryParams.errorCode,
      errorDescription: params.errorDescription || queryParams.errorDescription
    };
  }
  
  console.log("Tokens extraits:", { 
    hasAccessToken: !!params.accessToken, 
    hasRefreshToken: !!params.refreshToken, 
    type: params.typeParam,
    hasError: !!params.errorCode
  });
  
  return params;
};
