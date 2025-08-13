import clsx from "clsx";
import { Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function LogList({ logs = [], loading, error, onDeleteLog, limit, title = "Recent Logs" }) {
  const { t } = useTranslation();
  const logsToDisplay = limit ? logs.slice(0, limit) : logs;

  const handleDelete = (id) => {
    onDeleteLog(id);
  };

  // Render status label without icon, smaller and minimal
  const renderStatusLabel = (status) => {
    if (!status) return null;
    const s = status.toString().toUpperCase();

    const baseClasses =
      "inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full tracking-wide";

    switch (s) {
      case "OK":
        return (
          <span className={`${baseClasses} text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900`}>
            {t("OK")}
          </span>
        );
      case "CAUTION":
        return (
          <span className={`${baseClasses} text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900`}>
            {t("Caution")}
          </span>
        );
      case "WARNING":
        return (
          <span className={`${baseClasses} text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900`}>
            {t("Warning")}
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-800`}>
            {t("Unknown")}
          </span>
        );
    }
  };

  return (
    <div className="p-4 mt-4 bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t(title)}{limit ? ` (${logsToDisplay.length} ${t("latest")})` : ""}
        </h2>
        {limit && (
          <Link to="/logs" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            {t("Show More")}
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("Loading logs...")}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : logsToDisplay.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("No logs found.")}</p>
      ) : (
        <ul className="space-y-2">
          {logsToDisplay.map((log) => (
            <li
              key={log._id}
              className="p-3 text-sm border border-gray-200 rounded-md bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col max-w-[70%]">
                  <span className="font-medium">
                    {log.switchName}
                    {log.address && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {" "}({t("Address")}: {log.address})
                      </span>
                    )}
                  </span>

                  <p className="mt-1 text-gray-600 dark:text-gray-300">{log.message}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {/* Health Status Label */}
                  {renderStatusLabel(log.health_status)}

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (window.confirm(t("Delete this log?"))) {
                        handleDelete(log._id);
                      }
                    }}
                    className="text-xs text-red-600 cursor-pointer hover:underline dark:text-red-400"
                  >
                    {t("Delete")}
                  </button>
                </div>
              </div>

              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(log.timestamp).toLocaleString()}</span>
                {log.brokerUrl && (
                  <span className="truncate max-w-[50%] text-right">{log.brokerUrl}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
