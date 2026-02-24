public with sharing class TransactionController {

    @AuraEnabled(cacheable=true)
    public static List<Transaction__c> getTransactions(Id contactId, String status) {
        if (contactId == null) {
            return new List<Transaction__c>();
        }

        String query = 'SELECT Id, Amount__c, Status__c, CreatedDate FROM Transaction__c WHERE Contact__c = :contactId';

        if (String.isNotBlank(status)) {
            query += ' AND Status__c = :status';
        }

        query += ' ORDER BY CreatedDate DESC LIMIT 50';
        return Database.query(query);
    }

    @AuraEnabled
    public static void setStatusFailed(List<Id> transactionIds) {
        if (transactionIds == null || transactionIds.isEmpty()) {
            return;
        }

        List<Transaction__c> txns = [
            SELECT Id, Status__c
            FROM Transaction__c
            WHERE Id IN :transactionIds
        ];

        for (Transaction__c t : txns) {
            t.Status__c = 'Failed';
        }

        update txns;
    }
}
