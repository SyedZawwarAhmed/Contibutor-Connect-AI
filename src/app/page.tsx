import LandingPage from "@/components/client/LandingPage"
// import SignIn from "@/components/signin-github"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()
  return (
    <>
      <div>
        {/* <h1>Home</h1> */}
        {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}

        <LandingPage />
      </div>
      {/* <SignIn /> */}
    </>
  )
}
