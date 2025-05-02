
import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail, CachedCampaign } from "@/types/acelle.types";
import { updateLastSyncDate } from "./accounts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildProxyUrl } from "@/services/acelle/acelle-service";

/**
 * Extract campaigns from cache with proper type conversion
 */
const extractCampaignsFromCache = (cachedCampaigns: CachedCampaign[]): AcelleCampaign[] => {
  if (!cachedCampaigns || cachedCampaigns.length === 0) {
    return [];
  }
  
  console.log(`Converting ${cachedCampaigns.length} cached campaigns to AcelleCampaign format`);
  
  return cachedCampaigns.map(campaign => {
    // Convert delivery_info
    let deliveryInfo = {
      total: 0,
      delivery_rate: 0,
      unique_open_rate: 0,
      click_rate: 0,
      bounce_rate: 0,
      unsubscribe_rate: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: {
        soft: 0,
        hard: 0,
        total: 0
      },
      unsubscribed: 0,
      complained: 0
    };

    if (campaign.delivery_info) {
      // Handle string or object format
      if (typeof campaign.delivery_info === 'string') {
        try {
          const parsedInfo = JSON.parse(campaign.delivery_info);
          if (parsedInfo && typeof parsedInfo === 'object') {
            deliveryInfo = { ...deliveryInfo, ...parsedInfo };
            if (parsedInfo.bounced && typeof parsedInfo.bounced === 'object') {
              deliveryInfo.bounced = {
                ...deliveryInfo.bounced,
                ...parsedInfo.bounced
              };
            }
          }
        } catch (e) {
          console.warn("Error parsing delivery_info JSON:", e);
        }
      } else if (typeof campaign.delivery_info === 'object') {
        deliveryInfo = {
          ...deliveryInfo,
          ...campaign.delivery_info
        };
        
        if (campaign.delivery_info.bounced && typeof campaign.delivery_info.bounced === 'object') {
          deliveryInfo.bounced = {
            ...deliveryInfo.bounced,
            ...campaign.delivery_info.bounced
          };
        }
      }
    }

    // Create statistics from delivery_info
    const statistics = {
      subscriber_count: deliveryInfo.total || 0,
      delivered_count: deliveryInfo.delivered || 0,
      delivered_rate: deliveryInfo.delivery_rate || 0,
      open_count: deliveryInfo.opened || 0,
      uniq_open_rate: deliveryInfo.unique_open_rate || 0,
      click_count: deliveryInfo.clicked || 0,
      click_rate: deliveryInfo.click_rate || 0,
      bounce_count: deliveryInfo.bounced?.total || 0,
      soft_bounce_count: deliveryInfo.bounced?.soft || 0,
      hard_bounce_count: deliveryInfo.bounced?.hard || 0,
      unsubscribe_count: deliveryInfo.unsubscribed || 0,
      abuse_complaint_count: deliveryInfo.complained || 0
    };

    // Create complete AcelleCampaign object
    return {
      uid: campaign.campaign_uid,
      campaign_uid: campaign.campaign_uid,
      name: campaign.name || 'Sans nom',
      subject: campaign.subject || 'Sans sujet',
      status: campaign.status || 'unknown',
      created_at: campaign.created_at || new Date().toISOString(),
      updated_at: campaign.updated_at || new Date().toISOString(),
      delivery_date: campaign.delivery_date || '',
      run_at: campaign.run_at || '',
      last_error: campaign.last_error || '',
      delivery_info: deliveryInfo,
      statistics: statistics,
      meta: {},
      track: {},
      report: {}
    } as AcelleCampaign;
  });
};

/**
 * Check if the API is accessible with improved diagnostics
 */
export const checkApiAccess = async (account: AcelleAccount): Promise<boolean> => {
  try {
    console.log(`Testing API accessibility for account: ${account.name}`);
    
    // Get authentication session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("No access token available");
      return false;
    }
    
    // Clean API endpoint URL
    const apiEndpoint = account.apiEndpoint?.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
      
    if (!apiEndpoint) {
      console.error(`Invalid API endpoint for account: ${account.name}`);
      return false;
    }

    // Use buildProxyUrl for consistent URL construction
    const cacheBuster = Date.now().toString();
    const proxyUrl = buildProxyUrl('ping', { 
      api_token: account.apiToken,
      _t: cacheBuster // Add timestamp to prevent caching
    });
    
    console.log(`Checking API access with URL: ${proxyUrl}`);
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    try {
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`API access check failed: ${response.status}`);
        try {
          const errorData = await response.json();
          console.error("API error response:", errorData);
        } catch (e) {
          // Try to get text if JSON fails
          try {
            const errorText = await response.text();
            console.error(`API error text: ${errorText}`);
          } catch (textError) {
            console.error("Could not read error response");
          }
        }
        return false;
      }

      const result = await response.json();
      console.log("API access check successful:", result);
      return result && (result.status === 'active' || !!result.id);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error("API access check timed out");
      } else {
        console.error("API access check fetch error:", fetchError);
      }
      return false;
    }
  } catch (error) {
    console.error("API access check error:", error);
    return false;
  }
};

/**
 * Fetch campaign details with improved error handling
 */
export const fetchCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
  try {
    // Check API access first
    const isApiAccessible = await checkApiAccess(account);
    if (!isApiAccessible) {
      console.error("API not accessible, cannot fetch campaign details");
      toast.error("L'API Acelle n'est pas accessible actuellement");
      return null;
    }
    
    // Get authentication session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("No authentication token available for API request");
      return null;
    }
    
    console.log(`Fetching details for campaign ${campaignUid} from account ${account.name}`);
    
    // Use buildProxyUrl for consistent URL construction
    const cacheBuster = Date.now().toString();
    const proxyUrl = buildProxyUrl(`campaigns/${campaignUid}`, { 
      api_token: account.apiToken,
      _t: cacheBuster // Add timestamp to prevent caching
    });
    
    console.log(`Fetching campaign details with URL: ${proxyUrl}`);
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
    
    try {
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Failed to fetch campaign details: ${response.status}`);
        toast.error(`Erreur lors du chargement des détails (${response.status})`);
        return null;
      }

      const campaignDetails = await response.json();
      console.log(`Campaign details fetched successfully for ${campaignUid}`);
      
      // Ensure required structures exist
      if (!campaignDetails.statistics) {
        campaignDetails.statistics = {};
      }
      
      if (!campaignDetails.delivery_info) {
        campaignDetails.delivery_info = {};
      }
      
      if (campaignDetails.delivery_info && !campaignDetails.delivery_info.bounced) {
        campaignDetails.delivery_info.bounced = { soft: 0, hard: 0, total: 0 };
      }
      
      return campaignDetails;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`Timeout fetching details for campaign ${campaignUid}`);
        toast.error("Délai d'attente dépassé lors du chargement des détails");
      } else {
        console.error(`Error fetching details for campaign ${campaignUid}:`, fetchError);
        toast.error(`Erreur lors du chargement des détails: ${fetchError instanceof Error ? fetchError.message : "Erreur inconnue"}`);
      }
      return null;
    }
  } catch (error) {
    console.error(`Error fetching details for campaign ${campaignUid}:`, error);
    toast.error(`Erreur lors du chargement des détails: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    return null;
  }
};

/**
 * Fetch campaigns with improved error handling and caching fallback
 */
export const getAcelleCampaigns = async (account: AcelleAccount, page: number = 1, limit: number = 10): Promise<AcelleCampaign[]> => {
  try {
    console.log(`Fetching campaigns for account ${account.name}, page ${page}, limit ${limit}`);
    
    // Check API access first
    const isApiAccessible = await checkApiAccess(account);
    if (!isApiAccessible) {
      console.error("API not accessible, trying to fetch from cache");
      
      // Try to get data from cache
      try {
        const { data: cachedCampaigns } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, (page * limit) - 1);
          
        if (cachedCampaigns && cachedCampaigns.length > 0) {
          console.log(`Retrieved ${cachedCampaigns.length} campaigns from cache for account ${account.name}`);
          
          // Convert cache format to AcelleCampaign format
          return extractCampaignsFromCache(cachedCampaigns);
        }
      } catch (cacheError) {
        console.error(`Error retrieving campaigns from cache:`, cacheError);
      }
      
      return [];
    }
    
    // Get authentication session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("No authentication token available for API requests");
      return [];
    }
    
    // Use buildProxyUrl with cache buster
    const cacheBuster = Date.now().toString();
    const proxyUrl = buildProxyUrl('campaigns', {
      api_token: account.apiToken,
      page: page.toString(),
      per_page: limit.toString(),
      include_stats: 'true', // Get statistics
      _t: cacheBuster // Prevent caching
    });
    
    console.log(`Fetching campaigns with URL: ${proxyUrl}`);
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
    
    try {
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Failed to fetch campaigns: ${response.status}`);
        
        // Try to get data from cache
        try {
          const { data: cachedCampaigns } = await supabase
            .from('email_campaigns_cache')
            .select('*')
            .eq('account_id', account.id)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, (page * limit) - 1);
            
          if (cachedCampaigns && cachedCampaigns.length > 0) {
            console.log(`Retrieved ${cachedCampaigns.length} campaigns from cache for account ${account.name}`);
            return extractCampaignsFromCache(cachedCampaigns);
          }
        } catch (cacheError) {
          console.error(`Error retrieving campaigns from cache:`, cacheError);
        }
        
        return [];
      }
      
      // Clone response for potential error handling
      const responseClone = response.clone();
      
      try {
        const campaigns = await response.json();
        console.log(`Retrieved ${campaigns.length} campaigns for account ${account.name}`);
        
        // Enrich campaigns with required fields
        const enrichedCampaigns = campaigns.map(campaign => {
          return {
            ...campaign,
            meta: campaign.meta || {},
            statistics: campaign.statistics || {},
            delivery_info: campaign.delivery_info || {
              bounced: { soft: 0, hard: 0, total: 0 }
            },
            uid: campaign.uid || campaign.campaign_uid,
            campaign_uid: campaign.campaign_uid || campaign.uid,
            track: {}, // Initialize as empty object
            report: {} // Initialize as empty object
          } as AcelleCampaign;
        });
        
        // Update last sync date
        updateLastSyncDate(account.id);
        
        // Update cache in background
        try {
          for (const campaign of enrichedCampaigns) {
            // Prepare delivery_info for cache
            const deliveryInfo = {
              total: parseInt(campaign.statistics?.subscriber_count) || 0,
              delivered: parseInt(campaign.statistics?.delivered_count) || 0,
              delivery_rate: parseFloat(campaign.statistics?.delivered_rate) || 0,
              opened: parseInt(campaign.statistics?.open_count) || 0,
              unique_open_rate: parseFloat(campaign.statistics?.uniq_open_rate) || 0,
              clicked: parseInt(campaign.statistics?.click_count) || 0,
              click_rate: parseFloat(campaign.statistics?.click_rate) || 0,
              bounced: {
                soft: parseInt(campaign.statistics?.soft_bounce_count) || 0,
                hard: parseInt(campaign.statistics?.hard_bounce_count) || 0,
                total: parseInt(campaign.statistics?.bounce_count) || 0
              },
              unsubscribed: parseInt(campaign.statistics?.unsubscribe_count) || 0,
              complained: parseInt(campaign.statistics?.abuse_complaint_count) || 0
            };
            
            await supabase.from('email_campaigns_cache').upsert({
              campaign_uid: campaign.uid,
              account_id: account.id,
              name: campaign.name,
              subject: campaign.subject,
              status: campaign.status,
              created_at: campaign.created_at,
              updated_at: campaign.updated_at,
              delivery_date: campaign.delivery_at || campaign.run_at,
              run_at: campaign.run_at,
              last_error: campaign.last_error,
              delivery_info: deliveryInfo,
              cache_updated_at: new Date().toISOString()
            }, {
              onConflict: 'campaign_uid'
            });
          }
        } catch (cacheError) {
          console.error("Error updating cache:", cacheError);
        }
        
        return enrichedCampaigns;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        
        // Try to get raw text from cloned response
        try {
          const rawText = await responseClone.text();
          console.error("Raw response:", rawText.substring(0, 1000));
        } catch (textError) {
          console.error("Could not read raw response text:", textError);
        }
        
        // Try to get data from cache
        try {
          const { data: cachedCampaigns } = await supabase
            .from('email_campaigns_cache')
            .select('*')
            .eq('account_id', account.id)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, (page * limit) - 1);
            
          if (cachedCampaigns && cachedCampaigns.length > 0) {
            console.log(`Retrieved ${cachedCampaigns.length} campaigns from cache for account ${account.name}`);
            return extractCampaignsFromCache(cachedCampaigns);
          }
        } catch (cacheError) {
          console.error(`Error retrieving campaigns from cache:`, cacheError);
        }
        
        return [];
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Error fetching campaigns:", fetchError);
      
      // Try to get data from cache
      try {
        const { data: cachedCampaigns } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, (page * limit) - 1);
          
        if (cachedCampaigns && cachedCampaigns.length > 0) {
          console.log(`Retrieved ${cachedCampaigns.length} campaigns from cache for account ${account.name}`);
          return extractCampaignsFromCache(cachedCampaigns);
        }
      } catch (cacheError) {
        console.error(`Error retrieving campaigns from cache:`, cacheError);
      }
      
      return [];
    }
  } catch (error) {
    console.error(`Error fetching campaigns for account ${account.name}:`, error);
    return [];
  }
};

/**
 * Calculate aggregate statistics from campaigns
 */
export const calculateDeliveryStats = (campaigns: AcelleCampaign[]) => {
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  console.log(`Calculating statistics for ${campaigns.length} campaigns`);
  
  campaigns.forEach(campaign => {
    // Extract stats safely
    const getStatValue = (key: string): number => {
      try {
        // Try in statistics
        if (campaign.statistics && typeof campaign.statistics === 'object') {
          if (key in campaign.statistics && campaign.statistics[key] !== undefined) {
            const value = Number(campaign.statistics[key]);
            if (!isNaN(value)) return value;
          }
        }
        
        // Try in delivery_info
        if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
          if (key in campaign.delivery_info && campaign.delivery_info[key] !== undefined) {
            const value = Number(campaign.delivery_info[key]);
            if (!isNaN(value)) return value;
          }
          
          // Special case for bounced
          if (key === 'bounce_count' && campaign.delivery_info.bounced) {
            const value = Number(campaign.delivery_info.bounced.total);
            if (!isNaN(value)) return value;
          }
        }
        
        // Use alternative keys if primary not found
        const keyMappings: Record<string, string[]> = {
          'subscriber_count': ['total', 'recipient_count', 'subscribers_count'],
          'delivered_count': ['delivered'],
          'open_count': ['opened'],
          'bounce_count': ['bounced.total', 'total_bounces'],
          'click_count': ['clicked']
        };
        
        if (key in keyMappings) {
          for (const altKey of keyMappings[key]) {
            // Handle nested keys
            if (altKey.includes('.')) {
              const [parent, child] = altKey.split('.');
              if (campaign.delivery_info && campaign.delivery_info[parent]) {
                const value = Number(campaign.delivery_info[parent][child]);
                if (!isNaN(value)) return value;
              }
              continue;
            }
            
            // Check in different locations
            if (campaign.statistics && altKey in campaign.statistics) {
              const value = Number(campaign.statistics[altKey]);
              if (!isNaN(value)) return value;
            }
            
            if (campaign.delivery_info && altKey in campaign.delivery_info) {
              const value = Number(campaign.delivery_info[altKey]);
              if (!isNaN(value)) return value;
            }
          }
        }
        
        return 0;
      } catch (error) {
        console.warn(`Error extracting stat '${key}':`, error);
        return 0;
      }
    };
    
    // Get stats
    const sent = getStatValue('subscriber_count');
    const delivered = getStatValue('delivered_count');
    const opened = getStatValue('open_count');
    const clicked = getStatValue('click_count');
    const bounced = getStatValue('bounce_count');
    
    totalSent += sent;
    totalDelivered += delivered;
    totalOpened += opened;
    totalClicked += clicked;
    totalBounced += bounced;
  });
  
  return [
    { name: "Envoyés", value: totalSent },
    { name: "Livrés", value: totalDelivered },
    { name: "Ouverts", value: totalOpened },
    { name: "Cliqués", value: totalClicked },
    { name: "Bounces", value: totalBounced }
  ];
};

// Export for use in other modules
export { extractCampaignsFromCache };
