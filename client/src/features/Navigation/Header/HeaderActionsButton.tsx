import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { IoIosFlash } from "react-icons/io";
import { HeaderButton } from "./HeaderButton";
import ActionsModal from "@/features/ActionsModal/ActionsModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";

export const HeaderActionsButton: React.FC = () => {
    const { t } = useTranslation();
    const actionsModalRef = useRef<BaseModalRef>(null);
    const actionsTitle = t("header_actions_title");

    const handleOpenActions = () => {
        actionsModalRef.current?.openModal();
    };

    return (
        <>
            <HeaderButton
                aria-label={actionsTitle}
                title={actionsTitle}
                onClick={handleOpenActions}
                icon={<IoIosFlash />}
            />
            <ActionsModal ref={actionsModalRef} />
        </>
    );
};

export default HeaderActionsButton;
