
// growthDashboardFix.js - Placez ce fichier dans votre dossier public
(function() {
  console.log("🔧 Script de correction du dashboard Growth activé");
  
  // Variable pour suivre l'état actuel du filtre
  let currentFilter = 'all';
  
  // Fonction qui s'exécute régulièrement pour corriger l'interface
  function fixGrowthDashboard() {
    // 1. Rechercher les cartes de statistiques par leur titre
    const waitingCard = Array.from(document.querySelectorAll('h3, .card-title, div')).find(el => 
      el.textContent.includes("En attente d'assignation")
    );
    
    const myRequestsCard = Array.from(document.querySelectorAll('h3, .card-title, div')).find(el => 
      el.textContent.includes("Mes demandes à traiter")
    );
    
    // 2. Si les cards sont trouvées, ajouter des gestionnaires d'événements
    if (waitingCard && !waitingCard._fixed) {
      const cardElement = waitingCard.closest('.card, [role="button"], div[onClick]');
      if (cardElement) {
        console.log("🔧 Ajout du gestionnaire pour 'En attente d'assignation'");
        
        // Sauvegarder le gestionnaire original
        const originalClick = cardElement.onclick;
        
        // Remplacer par notre gestionnaire
        cardElement.onclick = function(e) {
          console.log("🎯 Clic sur 'En attente d'assignation'");
          
          // Appeler l'original pour maintenir le comportement existant
          if (originalClick) originalClick.call(this, e);
          
          // Appliquer notre propre filtrage après un court délai
          setTimeout(() => {
            // Marquer le filtre actuel
            currentFilter = 'waiting';
            
            // Appliquer notre filtrage manuel
            filterTableRows('waiting');
            
            // Afficher un toast personnalisé
            showCustomToast("Filtrage appliqué: demandes en attente d'assignation");
          }, 200);
        };
        
        waitingCard._fixed = true;
      }
    }
    
    if (myRequestsCard && !myRequestsCard._fixed) {
      const cardElement = myRequestsCard.closest('.card, [role="button"], div[onClick]');
      if (cardElement) {
        console.log("🔧 Ajout du gestionnaire pour 'Mes demandes à traiter'");
        
        // Sauvegarder le gestionnaire original
        const originalClick = cardElement.onclick;
        
        // Remplacer par notre gestionnaire
        cardElement.onclick = function(e) {
          console.log("🎯 Clic sur 'Mes demandes à traiter'");
          
          // Appeler l'original pour maintenir le comportement existant
          if (originalClick) originalClick.call(this, e);
          
          // Appliquer notre propre filtrage après un court délai
          setTimeout(() => {
            // Marquer le filtre actuel
            currentFilter = 'my_requests';
            
            // Appliquer notre filtrage manuel
            filterTableRows('my_requests');
            
            // Afficher un toast personnalisé
            showCustomToast("Filtrage appliqué: mes demandes à traiter");
          }, 200);
        };
        
        myRequestsCard._fixed = true;
      }
    }
    
    // Vérifier si les onglets de filtre ont été mis à jour
    const filterTabs = document.querySelectorAll('.filter-tab, [role="tab"]');
    filterTabs.forEach(tab => {
      if (tab._fixed) return;
      
      const originalClick = tab.onclick;
      tab.onclick = function(e) {
        console.log(`🎯 Clic sur l'onglet: ${tab.textContent}`);
        
        if (originalClick) originalClick.call(this, e);
        
        // Déterminer quel filtre appliquer
        let filterType = 'all';
        if (tab.textContent.includes("En attente")) {
          filterType = 'waiting';
        } else if (tab.textContent.includes("En cours")) {
          filterType = 'my_requests';
        } else if (tab.textContent.includes("Terminées")) {
          filterType = 'completed';
        } else if (tab.textContent.includes("En retard")) {
          filterType = 'late';
        }
        
        // Appliquer notre filtrage manuel après un court délai
        setTimeout(() => {
          currentFilter = filterType;
          filterTableRows(filterType);
        }, 200);
      };
      
      tab._fixed = true;
    });
  }
  
  // Fonction pour filtrer les lignes du tableau selon le type de filtre
  function filterTableRows(filterType) {
    console.log(`🔍 Application du filtre: ${filterType}`);
    
    // Trouver le tableau
    const tableRows = document.querySelectorAll('tr[data-request-id], tr.request-row');
    if (tableRows.length === 0) {
      console.log("⚠️ Aucune ligne de tableau trouvée");
      return;
    }
    
    console.log(`📊 Nombre total de lignes: ${tableRows.length}`);
    
    // Trouver l'utilisateur connecté
    let currentUser = "Inconnu";
    const userElement = document.querySelector('.user-name, .profile-name, .user-info');
    if (userElement) {
      currentUser = userElement.textContent.trim();
    }
    console.log(`👤 Utilisateur connecté: ${currentUser}`);
    
    // Compte pour les statistiques
    let displayedCount = 0;
    
    // Appliquer le filtre approprié
    tableRows.forEach(row => {
      // Trouver la cellule d'assignation
      const assignedCell = row.querySelector('td[data-column="assigned_to"]');
      const statusCell = row.querySelector('td[data-column="status"]');
      
      let assigned = assignedCell ? assignedCell.textContent.trim() : null;
      let status = statusCell ? statusCell.textContent.trim() : null;
      
      // Par défaut, afficher la ligne
      let shouldDisplay = true;
      
      switch (filterType) {
        case 'waiting':
          // Demandes non assignées
          shouldDisplay = !assigned || assigned === 'Non assigné' || assigned === '';
          break;
          
        case 'my_requests':
          // Mes demandes
          shouldDisplay = assigned === currentUser;
          break;
          
        case 'completed':
          // Demandes terminées
          shouldDisplay = status === 'Terminé' || status === 'Completed';
          break;
          
        case 'late':
          // Demandes en retard
          shouldDisplay = row.classList.contains('late') || 
                         (statusCell && statusCell.classList.contains('late')) ||
                         (status && (status.includes('retard') || status.includes('Late')));
          break;
          
        case 'all':
        default:
          // Toutes les demandes
          shouldDisplay = true;
          break;
      }
      
      // Appliquer la visibilité
      if (shouldDisplay) {
        row.style.display = '';
        displayedCount++;
      } else {
        row.style.display = 'none';
      }
    });
    
    console.log(`✅ Filtrage appliqué: ${displayedCount} lignes affichées`);
    
    // Afficher le résultat de manière visible
    const statsElement = document.createElement('div');
    statsElement.className = 'filter-stats-overlay';
    statsElement.style.position = 'fixed';
    statsElement.style.bottom = '60px';
    statsElement.style.right = '20px';
    statsElement.style.backgroundColor = 'rgba(25, 118, 210, 0.9)';
    statsElement.style.color = 'white';
    statsElement.style.padding = '8px 16px';
    statsElement.style.borderRadius = '4px';
    statsElement.style.zIndex = '9999';
    statsElement.style.fontSize = '14px';
    statsElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    statsElement.textContent = `${displayedCount} résultats affichés`;
    
    // Supprimer les anciennes statistiques
    const oldStats = document.querySelector('.filter-stats-overlay');
    if (oldStats) oldStats.remove();
    
    // Ajouter les nouvelles statistiques
    document.body.appendChild(statsElement);
    
    // Disparaître après 5 secondes
    setTimeout(() => {
      statsElement.style.opacity = '0';
      statsElement.style.transition = 'opacity 1s';
      setTimeout(() => statsElement.remove(), 1000);
    }, 5000);
  }
  
  // Fonction pour afficher un toast personnalisé
  function showCustomToast(message) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#4CAF50';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    toast.style.fontSize = '16px';
    toast.textContent = message;
    
    // Supprimer les anciens toasts
    const oldToasts = document.querySelectorAll('.custom-toast');
    oldToasts.forEach(t => t.remove());
    
    // Ajouter le nouveau toast
    document.body.appendChild(toast);
    
    // Disparaître après 3 secondes
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }
  
  // Appliquer les corrections immédiatement
  fixGrowthDashboard();
  
  // Continuer à surveiller les changements pour s'assurer que les corrections persistent
  const fixInterval = setInterval(fixGrowthDashboard, 1000);
  
  // Arrêter de surveiller après 30 secondes pour économiser les ressources
  setTimeout(() => {
    clearInterval(fixInterval);
    console.log("🔧 Surveillance automatique arrêtée après 30 secondes");
  }, 30000);
  
  // Réappliquer le dernier filtre si nécessaire (par exemple après un rechargement AJAX)
  const checkFilterInterval = setInterval(() => {
    if (currentFilter !== 'all') {
      // Vérifier si le tableau est vide alors qu'un filtre est actif
      const visibleRows = document.querySelectorAll('tr[data-request-id]:not([style*="display: none"]), tr.request-row:not([style*="display: none"])');
      if (visibleRows.length === 0) {
        console.log(`🔄 Réapplication du filtre: ${currentFilter}`);
        filterTableRows(currentFilter);
      }
    }
  }, 2000);
  
  // Arrêter après 5 minutes
  setTimeout(() => {
    clearInterval(checkFilterInterval);
    console.log("🔧 Vérification périodique arrêtée après 5 minutes");
  }, 300000);
  
  console.log("✅ Script de correction installé avec succès");
})();
