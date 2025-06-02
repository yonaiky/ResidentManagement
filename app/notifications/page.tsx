import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            View and manage your notifications
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            Your recent notifications and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: 1,
                message: "New payment received from John Doe",
                type: "success",
                createdAt: "2 hours ago",
              },
              {
                id: 2,
                message: "Payment due for Token #123 in 2 days",
                type: "warning",
                createdAt: "5 hours ago",
              },
              {
                id: 3,
                message: "New resident registered: Maria Garcia",
                type: "info",
                createdAt: "1 day ago",
              },
            ].map((notification) => (
              <div
                key={notification.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div className={`rounded-full p-2 ${
                  notification.type === "success"
                    ? "bg-green-100 text-green-700"
                    : notification.type === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
                >
                  {notification.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : notification.type === "warning" ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.createdAt}
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {notification.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}