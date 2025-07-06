import { signIn } from "@/lib/auth";

export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github");
      }}
    >
      <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">
        Signin with GitHub
      </button>
    </form>
  );
}
