import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
};

export default function ResidentDetailPage({ params }: Props) {
  redirect(`/residents/${params.id}/tokens`);
}
