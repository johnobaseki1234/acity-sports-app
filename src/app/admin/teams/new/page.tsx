import { TeamForm } from "@/components/admin/TeamForm";

export default function NewTeamPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Team</h1>
      <TeamForm />
    </div>
  );
}
