import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { createRecord, getRecordNotifyChange } from 'lightning/uiRecordApi';

import getTransactions from '@salesforce/apex/TransactionController.getTransactions';
import setStatus from '@salesforce/apex/TransactionController.setStatus';
import TRANSACTION_OBJECT from '@salesforce/schema/Transaction__c';
import AMOUNT_FIELD from '@salesforce/schema/Transaction__c.Amount__c';
import STATUS_FIELD from '@salesforce/schema/Transaction__c.Status__c';
import CONTACT_FIELD from '@salesforce/schema/Transaction__c.Contact__c';

export default class TransactionDashboard extends LightningElement {
    @api recordId;

    amount = null;
    selectedStatus = '';
    selectedRowIds = [];
    wiredResult;

    @track wireError;

    statusOptions = [
        { label: 'All',       value: ''          },
        { label: 'Pending',   value: 'Pending'   },
        { label: 'Completed', value: 'Completed' },
        { label: 'Failed',    value: 'Failed'    }
    ];

    columns = [
        { label: 'Amount',  fieldName: 'Amount__c',   type: 'currency' },
        { label: 'Status',  fieldName: 'Status__c',   type: 'text'     },
        { label: 'Created', fieldName: 'CreatedDate', type: 'date'     }
    ];

    @wire(getTransactions, { contactId: '$recordId', status: '$selectedStatus' })
    wiredTransactions(result) {
        this.wiredResult = result;
        if (result.error) {
            this.wireError = result.error;
            this.showToast('Error', result.error.body?.message ?? 'Failed to load transactions', 'error');
        } else {
            this.wireError = undefined;
        }
    }

    get transactions() {
        return this.wiredResult?.data ?? [];
    }

    get hasTransactions() {
        return this.transactions.length > 0;
    }

    get hasSelectedRows() {
        return this.selectedRowIds.length > 0;
    }

    get isSetFailedDisabled() {
        return !this.hasSelectedRows;
    }

    handleRowSelection(event) {
        this.selectedRowIds = event.detail.selectedRows.map(row => row.Id);
    }

    handleSetStatusFailed(){
        this.handleSetStatus('Failed')
    };

    handleSetStatusComplete(){
        this.handleSetStatus('Completed')
    };

    handleSetStatus(statusParam) {
        setStatus({ transactionIds: this.selectedRowIds, status:statusParam })
            .then(() => {
                this.showToast('Success', 'Status updated to ' + statusParam, 'success');
                this.selectedRowIds = [];
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                this.showToast('Error', error.body?.message ?? error.message, 'error');
            });
    }


    handleAmountChange(event) {
        this.amount = parseFloat(event.target.value);
    }

    handleStatusChange(event) {
        this.selectedStatus = event.detail.value;
    }

    handleCreate() {
        if (this.amount == null || isNaN(this.amount) || this.amount <= 0) {
            this.showToast('Validation Error', 'Enter a valid positive amount', 'warning');
            return;
        }

        const fields = {
            [AMOUNT_FIELD.fieldApiName]:  this.amount,
            [STATUS_FIELD.fieldApiName]:  'Pending',
            [CONTACT_FIELD.fieldApiName]: this.recordId
        };

        createRecord({ apiName: TRANSACTION_OBJECT.objectApiName, fields })
            .then(record => {
                this.showToast('Success', 'Transaction created!', 'success');
                this.amount = null;
                getRecordNotifyChange([{ recordId: record.id }]);
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                this.showToast('Error', error.body?.message ?? error.message, 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
