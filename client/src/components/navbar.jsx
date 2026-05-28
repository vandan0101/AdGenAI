import { useEffect, useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    SignInButton,
    SignUpButton,
    UserButton,
    useUser,
    useAuth
} from "@clerk/react";

import toast from "react-hot-toast";
import api from "../../configs/axios";

export default function Navbar() {

    const { isSignedIn, user, isLoaded } = useUser();
    const { getToken } = useAuth();

    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [credits, setCredits] = useState(0);

    const navlinks = [
        {
            href: "/Home",
            text: "Home",
        },
        {
            href: "/Generate",
            text: "Create",
        },
        {
            href: "/Community",
            text: "Community",
        },
        {
            href: "/Plans",
            text: "Plans",
        },
    ];

    const getUserCredits = async () => {
        try {

            const token = await getToken();

            const { data } = await api.get("/api/user/credits", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setCredits(data.credits);

        } catch (error) {

            toast.error(
                error?.response?.data?.message || error.message
            );

            console.log(error);
        }
    };

    const addTestCredits = async () => {
        try {
            const token = await getToken();

            const { data } = await api.post(
                "/api/user/credits/topup",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCredits(data.credits);
            toast.success(data.message);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
            console.log(error);
        }
    };

    useEffect(() => {
        if (user) {
            (async () => await getUserCredits())();
        }
    }, [user, pathname]);

    return (
        <>
            <motion.nav
                className="sticky top-0 z-50 flex items-center justify-between w-full h-20 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
            >

                <Link to="/" onClick={() => scrollTo(0, 0)}>
                    <img
                        className="h-11 w-auto"
                        src="/assets/logo.svg"
                        width={138}
                        height={36}
                        alt="logo"
                    />
                </Link>

                <div className="hidden lg:flex items-center gap-10 text-lg transition duration-500">

                    {navlinks.map((link) => (

                        <Link
                            onClick={() => scrollTo(0, 0)}
                            key={link.href}
                            to={link.href}
                            className="hover:text-slate-300 transition"
                        >
                            {link.text}
                        </Link>

                    ))}

                </div>

                <div className="hidden lg:flex items-center gap-3">

                    {isLoaded && (
                        <>
                            {isSignedIn ? (
                                <>
                                    <UserButton
                                        afterSignOutUrl="/"
                                        appearance={{
                                            elements: {
                                                avatarBox:
                                                    "w-10 h-10 ring-2 ring-indigo-500/50 hover:ring-indigo-400 transition",

                                                userButtonPopoverCard:
                                                    "bg-black/95 backdrop-blur-xl border border-white/10",

                                                userButtonPopoverActionButton:
                                                    "hover:bg-white/10 text-slate-300",

                                                userButtonPopoverActionButtonText:
                                                    "text-slate-300",

                                                userButtonPopoverActionButtonIcon:
                                                    "text-slate-400",

                                                userButtonPopoverFooter: "hidden",
                                            }
                                        }}
                                    >

                                        <UserButton.MenuItems>

                                            <UserButton.Action
                                                label="My Generations"
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={() => navigate("/my-generations")}
                                            />

                                            <UserButton.Action
                                                label="Community"
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={() => navigate("/community")}
                                            />

                                            <UserButton.Action
                                                label="Plans"
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={() => navigate("/plans")}
                                            />

                                            <UserButton.Action
                                                label={`Credits: ${credits}`}
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={() => navigate("/plans")}
                                            />

                                            <UserButton.Action
                                                label="Add Test Credits"
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={addTestCredits}
                                            />

                                        </UserButton.MenuItems>

                                    </UserButton>
                                </>
                            ) : (
                                <>
                                    <SignUpButton mode="modal">
                                        <button className="px-7 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition text-white rounded-full font-medium active:scale-95">
                                            Get Started
                                        </button>
                                    </SignUpButton>

                                    <SignInButton mode="modal">
                                        <button className="hover:bg-slate-300/20 transition px-7 py-3 border border-slate-400 rounded-full active:scale-95">
                                            Sign In
                                        </button>
                                    </SignInButton>
                                </>
                            )}
                        </>
                    )}

                </div>

                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="lg:hidden active:scale-90 transition"
                >
                    <MenuIcon className="size-6.5" />
                </button>

            </motion.nav>

            <div
                className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur flex flex-col items-center justify-center text-lg gap-8 lg:hidden transition-transform duration-400 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >

                {navlinks.map((link) => (

                    <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {link.text}
                    </Link>

                ))}

                {isLoaded && (
                    <div className="flex flex-col gap-4 mt-4">

                        {isSignedIn ? (
                            <>
                                <div className="flex justify-center">

                                    <UserButton
                                        afterSignOutUrl="/"
                                        appearance={{
                                            elements: {
                                                avatarBox:
                                                    "w-12 h-12 ring-2 ring-indigo-500/50",
                                            }
                                        }}
                                    >

                                        <UserButton.MenuItems>

                                            <UserButton.Action
                                                label="My Generations"
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={() => {
                                                    navigate("/my-generations");
                                                    setIsMenuOpen(false);
                                                }}
                                            />

                                            <UserButton.Action
                                                label="Community"
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={() => {
                                                    navigate("/community");
                                                    setIsMenuOpen(false);
                                                }}
                                            />

                                            <UserButton.Action
                                                label="Plans"
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={() => {
                                                    navigate("/plans");
                                                    setIsMenuOpen(false);
                                                }}
                                            />

                                            <UserButton.Action
                                                label={`Credits: ${credits}`}
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={() => {
                                                    navigate("/plans");
                                                    setIsMenuOpen(false);
                                                }}
                                            />

                                            <UserButton.Action
                                                label="Add Test Credits"
                                                labelIcon={<MenuIcon size={16} />}
                                                onClick={async () => {
                                                    await addTestCredits();
                                                    setIsMenuOpen(false);
                                                }}
                                            />

                                        </UserButton.MenuItems>

                                    </UserButton>

                                </div>
                            </>
                        ) : (
                            <>
                                <SignUpButton mode="modal">
                                    <button
                                        onClick={() => setIsMenuOpen(false)}
                                        className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition text-white rounded-full font-medium"
                                    >
                                        Get Started
                                    </button>
                                </SignUpButton>

                                <SignInButton mode="modal">
                                    <button
                                        onClick={() => setIsMenuOpen(false)}
                                        className="px-8 py-3 border border-slate-400 hover:bg-slate-300/20 transition rounded-full"
                                    >
                                        Sign In
                                    </button>
                                </SignInButton>
                            </>
                        )}

                    </div>
                )}

                <button
                    onClick={() => setIsMenuOpen(false)}
                    className="active:ring-3 active:ring-white aspect-square size-10 p-1 items-center justify-center bg-slate-100 hover:bg-slate-200 transition text-black rounded-md flex"
                >
                    <XIcon />
                </button>

            </div>
        </>
    );
}