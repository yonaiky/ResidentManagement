import { ResidentForm } from "@/components/ResidentForm";
import { prisma } from "@/lib/prisma";

interface EditResidentPageProps {
  params: {
    id: string;
  };
}

export default async function EditResidentPage({ params }: EditResidentPageProps) {
  const resident = await prisma.resident.findUnique({
    where: {
      id: parseInt(params.id),
    },
  });

  if (!resident) {
    return <div>Residente no encontrado</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Editar Residente</h1>
      <ResidentForm resident={resident} />
    </div>
  );
} 