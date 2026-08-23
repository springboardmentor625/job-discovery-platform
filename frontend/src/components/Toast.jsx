import { useEffect } from "react";

function Toast({
  message,
  type = "success",
  onClose
}) {

  useEffect(() => {

    if (!message) {
      return;
    }

    const timer = setTimeout(() => {

      onClose();

    }, 5000);

    return () => {
      clearTimeout(timer);
    };

  }, [message, onClose]);


  if (!message) {
    return null;
  }


  const icon =
    type === "success"
      ? "✓"
      : type === "error"
        ? "!"
        : "✦";


  return (

    <div
      className={`swipex-toast swipex-toast-${type}`}
      role="status"
      aria-live="polite"
    >

      <div className="swipex-toast-icon">

        {icon}

      </div>


      <div className="swipex-toast-content">

        <strong>
          SwipeX
        </strong>

        <span>
          {message}
        </span>

      </div>


      <button
        type="button"
        className="swipex-toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>

    </div>

  );

}

export default Toast;