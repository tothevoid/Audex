import { createToaster } from "@chakra-ui/react";

export const toaster = createToaster({
    placement: "bottom-end",
    pauseOnPageIdle: true,
    max: 5,
    overlap: false,
    gap: 12,
});

export default toaster;
