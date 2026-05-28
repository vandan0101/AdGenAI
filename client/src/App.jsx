import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/navbar";
import Footer from "./components/footer";
import LenisScroll from "./components/lenis-scroll";
import SoftBackdrop from "./components/SoftBackdrop";

import Home from "./pages/Home";
import Generator from "./pages/Generator";
import Result from "./pages/Result";
import Mygenerations from "./pages/Mygenerations";
import Community from "./pages/Community";
import Plans from "./pages/Plans";
import Loading from "./pages/Loading";

export default function App() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();

    useEffect(() => {
        const syncUser = async () => {
            if (!isLoaded || !isSignedIn || !user?.id) {
                return;
            }

            const storageKey = `user-synced-${user.id}`;

            if (sessionStorage.getItem(storageKey)) {
                return;
            }

            try {
                const token = await getToken();

                const configuredServerUrl =
                    import.meta.env.VITE_SERVER_URL;

                const candidateBaseUrls = [
                    configuredServerUrl,
                    "http://localhost:5001",
                ].filter(Boolean);

                let lastError = null;

                for (const apiBaseUrl of candidateBaseUrls) {
                    try {
                        const response = await fetch(
                            `${apiBaseUrl}/api/users/sync`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    ...(token
                                        ? {
                                              Authorization: `Bearer ${token}`,
                                          }
                                        : {}),
                                },
                                body: JSON.stringify({}),
                            }
                        );

                        if (response.ok) {
                            sessionStorage.setItem(storageKey, "true");
                            return;
                        }

                        const errorText = await response.text();

                        lastError = `Sync failed on ${apiBaseUrl}: ${response.status} ${errorText}`;
                    } catch (error) {
                        lastError = `Sync request failed on ${apiBaseUrl}: ${error}`;
                    }
                }

                console.error(
                    lastError ||
                        "User sync failed on all configured backends."
                );
            } catch (error) {
                console.error("User sync failed:", error);
            }
        };

        syncUser();
    }, [isLoaded, isSignedIn, user?.id, getToken]);

    return (
        <>
            <Toaster
                toastOptions={{
                    style: {
                        background: "#333",
                        color: "#fff",
                    },
                }}
            />

            <SoftBackdrop />

            <LenisScroll />
            <Navbar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Home" element={<Home />} />
                <Route path="/generate" element={<Generator />} />
                <Route path="/result/:projectId" element={<Result />} />
                <Route
                    path="/my-generations"
                    element={<Mygenerations />}
                />
                <Route path="/community" element={<Community />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/loading" element={<Loading />} />
            </Routes>

            <Footer />
        </>
    );
}