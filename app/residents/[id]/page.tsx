import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ResidentDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function ResidentDetailsPage({ params }: ResidentDetailsPageProps) {
  const resident = await prisma.resident.findUnique({
    where: {
      id: parseInt(params.id),
    },
    include: {
      tokens: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notifications: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!resident) {
    return <div>Residente no encontrado</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Detalles del Residente</h1>
        <div className="space-x-4">
          <Link href={`/residents/${resident.id}/edit`}>
            <Button>Editar</Button>
          </Link>
          <Link href="/residents">
            <Button variant="outline">Volver</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Información Personal */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
          <div className="space-y-4">
            <div>
              <label className="font-medium">Nombre:</label>
              <p>{resident.name}</p>
            </div>
            <div>
              <label className="font-medium">Cédula:</label>
              <p>{resident.cedula}</p>
            </div>
            <div>
              <label className="font-medium">Teléfono:</label>
              <p>{resident.phone}</p>
            </div>
            <div>
              <label className="font-medium">Dirección:</label>
              <p>{resident.address}</p>
            </div>
          </div>
        </div>

        {/* Estado de Pago */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Estado de Pago</h2>
          <div className="space-y-4">
            <div>
              <label className="font-medium">Estado:</label>
              <p className={`capitalize ${
                resident.paymentStatus === "paid" ? "text-green-600" :
                resident.paymentStatus === "pending" ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {resident.paymentStatus}
              </p>
            </div>
            <div>
              <label className="font-medium">Último Pago:</label>
              <p>{resident.lastPaymentDate 
                ? format(new Date(resident.lastPaymentDate), "PPP", { locale: es })
                : "No hay pagos registrados"}
              </p>
            </div>
            <div>
              <label className="font-medium">Próximo Pago:</label>
              <p>{resident.nextPaymentDate 
                ? format(new Date(resident.nextPaymentDate), "PPP", { locale: es })
                : "No hay fecha establecida"}
              </p>
            </div>
          </div>
        </div>

        {/* Tokens */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tokens</h2>
          <div className="space-y-4">
            {resident.tokens.length > 0 ? (
              resident.tokens.map((token) => (
                <div key={token.id} className="border-b pb-2">
                  <p className="font-medium">{token.name}</p>
                  <p className={`text-sm ${
                    token.status === "active" ? "text-green-600" : "text-red-600"
                  }`}>
                    Estado: {token.status}
                  </p>
                </div>
              ))
            ) : (
              <p>No hay tokens asignados</p>
            )}
          </div>
        </div>

        {/* Últimos Pagos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Últimos Pagos</h2>
          <div className="space-y-4">
            {resident.payments.length > 0 ? (
              resident.payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="border-b pb-2">
                  <p className="font-medium">
                    {format(new Date(payment.createdAt), "PPP", { locale: es })}
                  </p>
                  <p className="text-sm">
                    Monto: ${payment.amount}
                  </p>
                  <p className={`text-sm ${
                    payment.status === "paid" ? "text-green-600" :
                    payment.status === "pending" ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    Estado: {payment.status}
                  </p>
                </div>
              ))
            ) : (
              <p>No hay pagos registrados</p>
            )}
          </div>
        </div>

        {/* Notificaciones Recientes */}
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Notificaciones Recientes</h2>
          <div className="space-y-4">
            {resident.notifications.length > 0 ? (
              resident.notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="border-b pb-2">
                  <p className="font-medium">
                    {format(new Date(notification.createdAt), "PPP", { locale: es })}
                  </p>
                  <p className={`text-sm ${
                    notification.type === "warning" ? "text-yellow-600" :
                    notification.type === "error" ? "text-red-600" :
                    "text-blue-600"
                  }`}>
                    {notification.message}
                  </p>
                </div>
              ))
            ) : (
              <p>No hay notificaciones</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 