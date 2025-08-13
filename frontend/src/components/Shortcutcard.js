import { useTranslation } from "react-i18next";

export default function ShortcutCard({ title, children }) {
    const { t } = useTranslation();

    return (
        <>
            {title && (
                <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {t(title)}
                </h2>
            )}
            <div
                className="
          bg-gradient-to-tr from-white to-gray-50 dark:from-gray-800 dark:to-gray-900
          rounded-xl border border-gray-200 dark:border-gray-700
          shadow-md hover:shadow-xl
          p-5
          min-w-[180px] w-full max-w-sm
          h-[120px]
          flex flex-col justify-center
          cursor-pointer
          transition-all duration-300 ease-in-out
          hover:scale-[1.03]
          hover:border-gray-300 dark:hover:border-gray-600
        "
            >
                <div className="space-y-2 font-sans text-sm text-gray-800 dark:text-gray-200">
                    {children}
                </div>
            </div>
        </>
    );
}
