import React from "react";
import { useNavigate } from "react-router-dom";
import convertTime from "../../utils/convertTime.js";
import { BASE_URL } from "./../../config.js";
import { toast } from "react-toastify";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const SidePanel = ({ doctorId, ticketPrice, timeSlots }) => {
  const navigate = useNavigate();

  const bookingHandler = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken || currentToken === "null") {
      toast.error("Please login first to book an appointment");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(
        `${BASE_URL}/bookings/checkout-session/${doctorId}`,
        {
          method: "post",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error((data.message || "Booking failed") + " Please try again");
      }

      if (data.demoMode || data.session?.url) {
        navigate(data.session?.url || "/checkout-success");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Razorpay SDK failed to load. Please try again.");
      }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "AI-MedLab",
        description: `Appointment with ${data.doctor?.name || "Doctor"}`,
        order_id: data.order.id,
        prefill: {
          name: data.user?.name || "",
          email: data.user?.email || "",
          contact: data.user?.phone || "",
        },
        theme: {
          color: "#0067FF",
        },
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${BASE_URL}/bookings/verify-payment`, {
              method: "post",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentToken}`,
              },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed");
            }
            toast.success("Payment successful!");
            navigate(verifyData.redirectUrl || "/checkout-success");
          } catch (verifyErr) {
            toast.error(verifyErr.message);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (resp) {
        toast.error(resp.error?.description || "Payment failed");
      });
      razorpayInstance.open();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="shadow-panelShadow p-3 rounded-md">
      <div className="flex items-center justify-between">
        <p className="text__para mt-0 font-semibold">Ticket Price</p>
        <span className="text-[16px] leading-7 lg:text-[22px] lg:leading-8 text-headingColor font-bold">
          {ticketPrice} INR
        </span>
      </div>

      <div className="mt-[30px]">
        <p className="text__para mt-0 font-semibold text-headingColor">
          Available Time Slots:
        </p>

        <ul className="mt-3">
          {timeSlots?.map((item, index) => (
            <li key={index} className="flex items-center justify-between mb-2">
              <p className="text-[15px] leading-6 text-textColor font-semibold">
                {item.day.charAt(0).toUpperCase() + item.day.slice(1)}
              </p>
              <p className="text-[15px] leading-6 text-textColor font-semibold">
                {convertTime(item.startingTime)} -{" "}
                {convertTime(item.endingTime)}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={bookingHandler} className="btn px-2 w-full rounded-md">
        Book Appointment
      </button>
    </div>
  );
};

export default SidePanel;
