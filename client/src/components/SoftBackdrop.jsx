const SoftBackdrop = () => {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
            <div className="absolute inset-0 bg-[#07111f]" />
            <div className="absolute -top-24 left-[-8rem] h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="absolute top-24 right-[-6rem] h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="absolute bottom-[-8rem] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_25%)] opacity-80" />
        </div>
    );
};

export default SoftBackdrop;