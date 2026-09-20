import React, { RefObject, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SecurityEntity } from "../../../../models/securities/SecurityEntity";
import { SecurityTypeEntity } from "../../../../models/securities/SecurityTypeEntity";
import { CurrencyEntity } from "../../../../models/currencies/CurrencyEntity";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import BaseModal from "../../../../shared/modals/BaseModal/BaseModal";
import { getSecurityTypes } from "../../../../api/securities/securityTypeApi";
import { getCurrencies } from "../../../../api/currencies/currencyApi";
import { MarketSecurityInfoEntity } from "../../../../models/securities/SecurityEntity";
import { SecurityFormInput } from "./SecurityValidationSchema";
import SecuritySearchForm from "./components/SecuritySearchForm";
import SecurityDetailsForm from "./components/SecurityDetailsForm";
import { generateGuid } from "../../../../shared/utilities/idUtilities";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>;
    security?: SecurityEntity | null;
    onSaved: (security: SecurityEntity, icon: File | null) => void;
}

interface State {
    securityTypes: SecurityTypeEntity[];
    currencies: CurrencyEntity[];
}

const SecurityModal: React.FC<ModalProps> = ({
    modalRef,
    security,
    onSaved
}) => {
    const { t } = useTranslation();
    const isEditMode = !!security;

    const [step, setStep] = useState<"search" | "details">(isEditMode ? "details" : "search");
    const [initialFormData, setInitialFormData] = useState<Partial<SecurityFormInput>>({});
    const [state, setState] = useState<State>({ securityTypes: [], currencies: [] });

    useEffect(() => {
        const initData = async () => {
            const securityTypes = await getSecurityTypes();
            const currencies = await getCurrencies();
            setState({ securityTypes, currencies });
        };
        initData();
    }, []);

    const resetModal = React.useCallback(() => {
        if (security) {
            setStep("details");
            setInitialFormData({
                id: security.id,
                name: security.name,
                ticker: security.ticker,
                isin: security.isin ?? "",
                type: security.type,
                currency: security.currency
            });
        } else {
            setStep("search");
            setInitialFormData({
                id: generateGuid(),
                name: "",
                ticker: "",
                isin: "",
                type: undefined,
                currency: undefined
            });
        }
    }, [security]);

    useEffect(() => {
        resetModal();
    }, [resetModal]);

    const handleClose = () => {
        resetModal();
        modalRef?.current?.closeModal();
    };

    const handleMarketFound = (marketInfo: MarketSecurityInfoEntity) => {
        const matchedType = state.securityTypes.find(type => type.id === marketInfo.typeId)
            ?? state.securityTypes[0];

        const matchedCurrency = state.currencies.find(c => c.id === marketInfo.currencyId)
            ?? state.currencies[0];

        setInitialFormData({
            id: generateGuid(),
            ticker: marketInfo.ticker,
            name: marketInfo.name,
            isin: marketInfo.isin ?? "",
            type: matchedType,
            currency: matchedCurrency
        });
        setStep("details");
    };

    const handleManualEntry = (query?: string) => {
        const tkr = (query ?? "").trim().toUpperCase();
        setInitialFormData({
            id: generateGuid(),
            ticker: tkr,
            name: tkr,
            isin: "",
            type: state.securityTypes[0],
            currency: state.currencies[0]
        });
        setStep("details");
    };

    const handleSave = (savedSecurity: SecurityEntity, icon: File | null) => {
        onSaved(savedSecurity, icon);
        handleClose();
    };

    const title = step === "search"
        ? t("entity_security_search_title")
        : t("entity_security_form_title");

    return (
        <BaseModal
            ref={modalRef}
            title={title}
            maxW="540px"
        >
            {step === "search" && !isEditMode ? (
                <SecuritySearchForm
                    onFound={handleMarketFound}
                    onManual={handleManualEntry}
                    onCancel={handleClose}
                />
            ) : (
                <SecurityDetailsForm
                    key={initialFormData.id ?? initialFormData.ticker ?? "new"}
                    initialValues={initialFormData}
                    security={security}
                    securityTypes={state.securityTypes}
                    currencies={state.currencies}
                    onSave={handleSave}
                    onCancel={handleClose}
                    onBackToSearch={!isEditMode ? () => setStep("search") : undefined}
                />
            )}
        </BaseModal>
    );
};

export default SecurityModal;