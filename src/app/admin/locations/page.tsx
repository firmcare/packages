import { requireAdmin } from "@/lib/auth-utils";
import HomeCollectionLocationsManager from "@/components/admin/HomeCollectionLocationsManager";

export default async function LocationsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Home Collection Locations</h1>
        <p className="text-gray-600 mt-2">Configure service areas and pricing for home sample collection.</p>
      </div>
      <HomeCollectionLocationsManager />
    </div>
  );
}
