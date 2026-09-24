import React from "react";
import { SampleRequestItem } from "../types";
import { ProductDetailItem } from "../api";
import { ProductSpecificationsDrawer } from "./ProductSpecificationsDrawer";

export interface SampleRequestDetailsDrawerProps {
  request: SampleRequestItem;
  details: ProductDetailItem[];
  isLoadingDetails: boolean;
  onClose: () => void;
}

/**
 * Backward compatibility wrapper for ProductSpecificationsDrawer
 */
export const SampleRequestDetailsDrawer: React.FC<SampleRequestDetailsDrawerProps> = ({
  request,
  details,
  isLoadingDetails,
  onClose,
}) => {
  return (
    <ProductSpecificationsDrawer
      product={request}
      details={details}
      isLoading={isLoadingDetails}
      specMode="view"
      allowEdit={false}
      onClose={onClose}
    />
  );
};
