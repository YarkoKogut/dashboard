@isTest
private class TransactionControllerTest {

    @TestSetup
    static void makeData() {
        Contact contact = new Contact(LastName = 'Test Contact');
        insert contact;

        List<Transaction__c> txns = new List<Transaction__c>{
            new Transaction__c(Amount__c = 100, Status__c = 'Pending',   Contact__c = contact.Id),
            new Transaction__c(Amount__c = 200, Status__c = 'Completed', Contact__c = contact.Id),
            new Transaction__c(Amount__c = 300, Status__c = 'Failed',    Contact__c = contact.Id)
        };
        insert txns;
    }

    @isTest
    static void testNullContactId() {
        Test.startTest();
        List<Transaction__c> result = TransactionController.getTransactions(null, null);
        Test.stopTest();

        Assert.areEqual(0, result.size(), 'Expected empty list for null contactId');
    }

    @isTest
    static void testGetAllTransactions() {
        Contact contact = [SELECT Id FROM Contact LIMIT 1];

        Test.startTest();
        List<Transaction__c> result = TransactionController.getTransactions(contact.Id, null);
        Test.stopTest();

        Assert.areEqual(3, result.size(), 'Expected all 3 transactions');
    }

    @isTest
    static void testFilterByStatus() {
        Contact contact = [SELECT Id FROM Contact LIMIT 1];

        Test.startTest();
        List<Transaction__c> result = TransactionController.getTransactions(contact.Id, 'Pending');
        Test.stopTest();

        Assert.areEqual(1, result.size(), 'Expected 1 Pending transaction');
        Assert.areEqual('Pending', result[0].Status__c, 'Expected status Pending');
    }

    @isTest
    static void testBlankStatusReturnsAll() {
        Contact contact = [SELECT Id FROM Contact LIMIT 1];

        Test.startTest();
        List<Transaction__c> result = TransactionController.getTransactions(contact.Id, '');
        Test.stopTest();

        Assert.areEqual(3, result.size(), 'Expected all 3 transactions for blank status');
    }

    @isTest
    static void testContactWithNoTransactions() {
        Contact emptyContact = new Contact(LastName = 'Empty Contact');
        insert emptyContact;

        Test.startTest();
        List<Transaction__c> result = TransactionController.getTransactions(emptyContact.Id, null);
        Test.stopTest();

        Assert.areEqual(0, result.size(), 'Expected empty list for contact with no transactions');
    }
}
