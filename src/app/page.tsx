import Login from "./login/page"
import { ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
  return (
    <>
      <Login/>
      <ToastContainer limit={4}/>
    </>
  )
}
