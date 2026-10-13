import React, { RefObject, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MarketSecurityInfoEntity, SecurityEntity } from "@/models/securities/SecurityEntity";
import { SecurityTypeEntity } from "@/models/securities/SecurityTypeEntity";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";
import { getSecurityTypes } from "@/api/securities/securityTypeApi";
import { getCurrencies } from "@/api/currencies/currencyApi";
import { SecurityFormInput } from "./SecurityValidationSchema";
import SecuritySearchForm from "./components/SecuritySearchForm";
import SecurityDetailsForm from "./components/SecurityDetailsForm";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { OperationResult } from "@/shared/models/OperationResult";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>;
    security?: SecurityEntity | null;
    onSaved: (security: SecurityEntity, icon: File | null) => Promise<OperationResult<SecurityEntity>>;
}

interface State {
    securityTypes: SecurityTypeEntity[];
    currencies: CurrencyEntity[];
}

const getInitialFormData = (targetSecurity?: SecurityEntity | null): Partial<SecurityFormInput> => {
    if (targetSecurity) {
        return {
            id: targetSecurity.id,
            name: targetSecurity.name,
            ticker: targetSecurity.ticker,
            isin: targetSecurity.isin ?? "",
            type: targetSecurity.type,
            currency: targetSecurity.currency
        };
    }
    return {
        id: generateGuid(),
        name: "",
        ticker: "",
        isin: "",
        type: undefined,
        currency: undefined
    };
};

const SecurityModal: React.FC<ModalProps> = ({
    modalRef,
    security,
    onSaved
}) => {
    const { t } = useTranslation();
    const isEditMode = !!security;

    const [step, setStep] = useState<"search" | "details">(isEditMode ? "details" : "search");
    const [initialFormData, setInitialFormData] = useState<Partial<SecurityFormInput>>(() => getInitialFormData(security));
    const [state, setState] = useState<State>({ securityTypes: [], currencies: [] });

    useEffect(() => {
        let isMounted = true;
        const initData = async () => {
            const [securityTypes, currencies] = await Promise.all([
                getSecurityTypes(),
                getCurrencies()
            ]);
            if (isMounted) {
                setState({ securityTypes, currencies });
            }
        };
        initData();
        return () => {
            isMounted = false;
        };
    }, []);

    const [previousSecurity, setPreviousSecurity] = useState(security);
    if (security !== previousSecurity) {
        setPreviousSecurity(security);
        setStep(security ? "details" : "search");
        setInitialFormData(getInitialFormData(security));
    }

    const resetModal = useCallback(() => {
        setStep(security ? "details" : "search");
        setInitialFormData(getInitialFormData(security));
    }, [security]);

    const handleClose = () => {
        resetModal();
        modalRef?.current?.closeModal();
    };

    const handleMarketFound = (marketInfo: MarketSecurityInfoEntity) => {
        const matchedType = state.securityTypes.find(type => type.id === marketInfo.typeId)
            ?? state.securityTypes[0];

        const matchedCurrency = state.currencies.find(currencyItem => currencyItem.id === marketInfo.currencyId)
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
        const tickerValue = (query ?? "").trim().toUpperCase();
        setInitialFormData({
            id: generateGuid(),
            ticker: tickerValue,
            name: tickerValue,
            isin: "",
            type: state.securityTypes[0],
            currency: state.currencies[0]
        });
        setStep("details");
    };

    const handleSave = async (savedSecurity: SecurityEntity, icon: File | null): Promise<OperationResult<SecurityEntity>> => {
        const result = await onSaved(savedSecurity, icon);
        if (result.isSuccess) {
            handleClose();
        }
        return result;
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