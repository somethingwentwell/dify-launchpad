import { redirect } from 'next/navigation'

const Home = async () => {
  // Redirect directly to apps since this is now a studio-only launchpad
  redirect('/apps')
}

export default Home
