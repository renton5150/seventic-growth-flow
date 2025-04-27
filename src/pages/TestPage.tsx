
import { AppLayout } from "@/components/layout/AppLayout";

const TestPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Page de test</h1>
        <p className="text-muted-foreground">
          Cette page est destinée aux tests de développement.
        </p>
      </div>
    </AppLayout>
  );
};

export default TestPage;
