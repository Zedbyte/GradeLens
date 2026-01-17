import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        // navigation will be handled later by route guards
    };

    return (
        <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        {user && (
            <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
                Logged in as
            </p>
            <p className="font-medium">{user.email}</p>
            <p className="text-sm">Role: {user.role}</p>
            </div>
        )}

        <Button variant="destructive" onClick={handleLogout}>
            Log out
        </Button>
        </div>
    );
}
