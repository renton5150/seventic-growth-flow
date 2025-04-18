
const handleStatCardClick = useCallback((filterType: "all" | "pending" | "completed" | "late") => {
  console.log(`Stat card clicked: ${filterType}`);
  
  // Si on clique sur le filtre déjà actif, on le désactive
  if (activeFilter === filterType) {
    setActiveFilter(null);
    // Suppression du toast
    setActiveTab("all");
  } else {
    setActiveFilter(filterType);
    
    // Appliquer le filtre correspondant sans toast
    switch (filterType) {
      case "all":
        setActiveTab("all");
        break;
      case "pending":
        setActiveTab("pending");
        break;
      case "completed":
        setActiveTab("completed");
        break;
      case "late":
        setActiveTab("late");
        break;
    }
  }
}, [activeFilter, setActiveTab]);
