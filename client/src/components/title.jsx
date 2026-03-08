export default function Title({ heading, description }) {
    return (
        <div className="text-center">
            <h1 className="text-4xl font-semibold">{heading}</h1>
            <p className="text-center text-sm text-slate-300 mt-2 max-w-2xl mx-auto">
                {description}
            </p>
        </div>
    );
}
