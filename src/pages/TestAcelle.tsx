
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TestAcelle = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://dupguifqyjchlmzbadav.functions.supabase.co/acelle-basic-auth/campaigns');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Test Acelle API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={testApi}
                disabled={loading}
              >
                {loading ? "Chargement..." : "Tester l'API"}
              </Button>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md">
                  Erreur: {error}
                </div>
              )}

              {result && (
                <pre className="p-4 bg-slate-50 rounded-md overflow-x-auto">
                  {result}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TestAcelle;
