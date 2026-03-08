import { Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar";
import Footer from "./components/footer";
import LenisScroll from "./components/lenis-scroll";

import Home from "./pages/Home";
import Generator from "./pages/Generator";
import Result from "./pages/Result";
import Mygenerations from "./pages/Mygenerations";
import Community from "./pages/Community";
import Plans from "./pages/Plans";
import Loading from "./pages/Loading";


export default function App() {
    return (
        <>
            <LenisScroll />
            <Navbar />

            <Routes>
                <Route path="/Home" element={<Home />} />
                <Route path="/generate" element={<Generator />} />
                <Route path="/result/:project" element={<Result />} />
                <Route path="/my-generations" element={<Mygenerations />} />
                <Route path="/community" element={<Community />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/loading" element={<Loading />} />
            </Routes>

            <Footer />
        </>
    );
}
