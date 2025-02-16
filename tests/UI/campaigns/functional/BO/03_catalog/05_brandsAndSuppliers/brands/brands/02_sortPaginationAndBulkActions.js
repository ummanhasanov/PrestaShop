// Import utils
import basicHelper from '@utils/basicHelper';
import files from '@utils/files';
import helper from '@utils/helpers';
import testContext from '@utils/testContext';

// Import common tests
import loginCommon from '@commonTests/BO/loginBO';

require('module-alias/register');

// Import expect from chai
const {expect} = require('chai');
const {importFileTest} = require('@commonTests/BO/advancedParameters/importFile');

// Import pages
const dashboardPage = require('@pages/BO/dashboard');
const brandsPage = require('@pages/BO/catalog/brands');

// Import data
const {Data} = require('@data/import/brands');

const baseContext = 'functional_BO_catalog_brandsAndSuppliers_brands_brands_sortPaginationAndBulkActions';

let browserContext;
let page;
let numberOfBrands = 0;
const tableName = 'manufacturer';

// Variable used to create customers csv file
const fileName = 'brands.csv';
const numberOfImportedBrands = 10;

/*
Pre-condition:
- Import list of customers
Scenario:
- Paginate between pages
- Sort brands table
- Enable/Disable/Delete brands with bulk actions
 */
describe('BO - Catalog - Brands & Suppliers : Sort, pagination and bulk actions Brands table', async () => {
  // Pre-condition: Import list of categories
  importFileTest(fileName, Data.entity, `${baseContext}_preTest_1`);

  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);
    // Create csv file with all brands data
    await files.createCSVFile('.', fileName, Data);
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
    // Delete created csv file
    await files.deleteFile(fileName);
  });

  // 1 : Pagination of brands table
  describe('Pagination next and previous of Brands table', async () => {
    it('should login in BO', async function () {
      await loginCommon.loginBO(this, page);
    });

    it('should go to \'Catalog > Brands & Suppliers\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToBrandsPage', baseContext);

      await dashboardPage.goToSubMenu(
        page,
        dashboardPage.catalogParentLink,
        dashboardPage.brandsAndSuppliersLink,
      );
      await dashboardPage.closeSfToolBar(page);

      const pageTitle = await brandsPage.getPageTitle(page);
      await expect(pageTitle).to.contains(brandsPage.pageTitle);
    });

    it('should reset all filters and get number of brands in BO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilterBrandsTable', baseContext);

      numberOfBrands = await brandsPage.resetAndGetNumberOfLines(page, tableName);
      await expect(numberOfBrands).to.be.above(0);
    });

    it('should change the items number to 10 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'brandsChangeItemsNumberTo10', baseContext);

      const paginationNumber = await brandsPage.selectPaginationLimit(page, tableName, '10');
      expect(paginationNumber).to.contains('(page 1 / 2)');
    });

    it('should click on next', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'brandsClickOnNext', baseContext);

      const paginationNumber = await brandsPage.paginationNext(page, tableName);
      expect(paginationNumber).to.contains('(page 2 / 2)');
    });

    it('should click on previous', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'brandsClickOnPrevious', baseContext);

      const paginationNumber = await brandsPage.paginationPrevious(page, tableName);
      expect(paginationNumber).to.contains('(page 1 / 2)');
    });

    it('should change the items number to 50 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'brandsChangeItemsNumberTo50', baseContext);

      const paginationNumber = await brandsPage.selectPaginationLimit(page, tableName, '50');
      expect(paginationNumber).to.contains('(page 1 / 1)');
    });
  });

  // 2 : sort brands
  describe('Sort Brands table', async () => {
    const brandsTests = [
      {
        args:
          {
            testIdentifier: 'sortBrandsByIdBrandDesc', sortBy: 'id_manufacturer', sortDirection: 'desc', isFloat: true,
          },
      },
      {args: {testIdentifier: 'sortBrandsByNameAsc', sortBy: 'name', sortDirection: 'asc'}},
      {args: {testIdentifier: 'sortBrandsByNameDesc', sortBy: 'name', sortDirection: 'desc'}},
      {
        args:
          {
            testIdentifier: 'sortBrandsByIdBrandAsc', sortBy: 'id_manufacturer', sortDirection: 'asc', isFloat: true,
          },
      },
    ];
    brandsTests.forEach((test) => {
      it(
        `should sort by '${test.args.sortBy}' '${test.args.sortDirection}' and check result`,
        async function () {
          await testContext.addContextItem(this, 'testIdentifier', test.args.testIdentifier, baseContext);

          const nonSortedTable = await brandsPage.getAllRowsColumnContentBrandsTable(page, test.args.sortBy);

          await brandsPage.sortTableBrands(page, test.args.sortBy, test.args.sortDirection);
          const sortedTable = await brandsPage.getAllRowsColumnContentBrandsTable(page, test.args.sortBy);

          if (test.args.isFloat) {
            const nonSortedTableFloat = nonSortedTable.map((text) => parseFloat(text));
            const sortedTableFloat = sortedTable.map((text) => parseFloat(text));

            const expectedResult = await basicHelper.sortArrayNumber(nonSortedTableFloat);

            if (test.args.sortDirection === 'asc') {
              await expect(sortedTableFloat).to.deep.equal(expectedResult);
            } else {
              await expect(sortedTableFloat).to.deep.equal(expectedResult.reverse());
            }
          } else {
            const expectedResult = await basicHelper.sortArray(nonSortedTable);

            if (test.args.sortDirection === 'asc') {
              await expect(sortedTable).to.deep.equal(expectedResult);
            } else {
              await expect(sortedTable).to.deep.equal(expectedResult.reverse());
            }
          }
        },
      );
    });
  });

  // 3 : Disable, enable Brands
  describe('Disable, enable created Brands', async () => {
    it('should filter list by name', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterToDisableBrands', baseContext);

      await brandsPage.filterBrands(page, 'input', 'name', 'todelete');
      const textColumn = await brandsPage.getTextColumnFromTableBrands(page, 1, 'name');
      await expect(textColumn).to.contains('todelete');
    });

    const tests = [
      {args: {action: 'disable', enabledValue: false}},
      {args: {action: 'enable', enabledValue: true}},
    ];

    tests.forEach((test) => {
      it(`should ${test.args.action} brands`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.action}Brand`, baseContext);

        const textResult = await brandsPage.bulkSetBrandsStatus(page, test.args.enabledValue);
        await expect(textResult).to.be.equal(brandsPage.successfulUpdateStatusMessage);

        const numberOfBrandsInGrid = await brandsPage.getNumberOfElementInGrid(page, tableName);
        await expect(numberOfBrandsInGrid).to.be.equal(numberOfImportedBrands);

        for (let i = 1; i <= numberOfBrandsInGrid; i++) {
          const brandStatus = await brandsPage.getBrandStatus(page, i);
          await expect(brandStatus).to.equal(test.args.enabledValue);
        }
      });
    });

    it('should reset filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetAfterBulkEdit', baseContext);

      const numberOfBrandsAfterReset = await brandsPage.resetAndGetNumberOfLines(page, tableName);
      await expect(numberOfBrandsAfterReset).to.be.equal(numberOfBrands);
    });
  });

  // 4 : Delete brands with bulk actions
  describe('Delete Brands with bulk actions', async () => {
    it('should filter list by name', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterToDeleteBrands', baseContext);

      await brandsPage.filterBrands(page, 'input', 'name', 'todelete');
      const textColumn = await brandsPage.getTextColumnFromTableBrands(page, 1, 'name');
      await expect(textColumn).to.contains('todelete');
    });

    it('should delete with bulk actions and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteBrands', baseContext);

      const deleteTextResult = await brandsPage.deleteWithBulkActions(page, tableName);
      await expect(deleteTextResult).to.be.equal(brandsPage.successfulDeleteMessage);
    });

    it('should reset filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetAfterDeleteBrands', baseContext);

      const numberOfBrandsAfterReset = await brandsPage.resetAndGetNumberOfLines(page, tableName);
      await expect(numberOfBrandsAfterReset).to.be.equal(numberOfBrands - numberOfImportedBrands);
    });
  });
});
