import React from "react";
import axios from "axios";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const DeleteButton = ({ selectedItems = [], onDeleteSuccess }) => {
    // Handle delete click
    const handleDelete = async () => {
        if (!selectedItems || selectedItems.length === 0) return;

        try {
            // ✅ Send DELETE request to backend
            const response = await axios.post("http://localhost:5000/api/delete", {
                items: selectedItems,
            });

            if (response.status === 200) {
                alert("Items deleted successfully ✅");
                if (onDeleteSuccess) {
                    onDeleteSuccess(selectedItems); // notify parent after success
                }
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete items ❌");
        }
    };

    // Hide button if nothing is selected
    if (!selectedItems || selectedItems.length === 0) {
        return null;
    }

    return (
        <Button
            onClick={handleDelete}
            variant="danger"
            className="d-flex align-items-center justify-content-between rounded-2"
        >
            <FontAwesomeIcon icon={faTrashAlt} />
            &nbsp; Delete {selectedItems.length > 1 ? "Items" : "Item"}
        </Button>
    );
};

export default DeleteButton;
