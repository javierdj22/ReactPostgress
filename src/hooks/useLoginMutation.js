import { useMutation } from "@tanstack/react-query";

const loginUser = async ({ username, password }) => {
  const response = await fetch("http://localhost:5031/api/Auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, PasswordHash: password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error en login");
  }

  return response.json();
};

export function useLoginMutation(onSuccessCallback) {
  return useMutation({
    mutationFn: loginUser,
    onSuccess: onSuccessCallback,
  });
}
