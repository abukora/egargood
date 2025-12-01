function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('نظام الإيجارات الزراعية')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * وظيفة مساعدة: التحقق من وجود ورقة تفاصيل المساحات وإنشائها إذا لم توجد.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} ورقة عمل تفاصيل المساحات.
 */
function getDetailsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'تفاصيل المساحات';
  let ws = ss.getSheetByName(sheetName);

  if (!ws) {
    // إنشاء الورقة وإضافة الرؤوس إذا لم تكن موجودة
    ws = ss.insertSheet(sheetName);
    const headers = ['اسم المستأجر', 'الناحية', 'الحوض', 'السهم', 'القيراط', 'الفدان', 'الموقع'];
    ws.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return ws;
}

/**
 * جلب بيانات المستأجرين من الورقة الرئيسية.
 */
function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheets()[0]; // الورقة الرئيسية
  const headers = ['الجريدة','اسم المستأجر','الناحية','السهم','القيراط','الفدان','التعديات','واضع اليد','الموقع','ملاحظات'];
  
  // ضمان وجود رؤوس للورقة الرئيسية
  const lastRow = ws.getLastRow();
  if (lastRow < 1) {
    ws.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  // ضمان إنشاء ورقة تفاصيل المساحات عند تحميل البيانات الرئيسية
  getDetailsSheet(); 

  // جلب البيانات بدءاً من الصف الثاني
  if (lastRow <= 1) return [];
  const dataRange = ws.getRange(2, 1, lastRow - 1, headers.length);
  return dataRange.getValues();
}

/**
 * جلب تفاصيل قطع الأراضي الخاصة بمستأجر معين.
 * @param {string} tenantName اسم المستأجر المراد جلب تفاصيله.
 * @returns {Array<Array<any>>} مصفوفة تتضمن (رقم صف الشيت الفعلي) + (البيانات).
 */
function getAreaDetails(tenantName) {
  const ws = getDetailsSheet();
  const lastRow = ws.getLastRow();
  if (lastRow <= 1) return [];
  
  const allData = ws.getRange(1, 1, lastRow, ws.getLastColumn()).getValues();
  const data = allData.slice(1);
  
  // عمود اسم المستأجر هو العمود الأول (index 0) في ورقة التفاصيل
  const filteredData = data.map((row, index) => ({
    sheetRowIndex: index + 2, // +2 لأن الصف 1 هو الرأس، والبيانات تبدأ من الصف 2
    record: row
  })).filter(item => item.record[0] === tenantName); // Filter by 'اسم المستأجر'
  
  // نُرجع رقم الصف الفعلي في الشيت والبيانات معاً
  return filteredData.map(item => [item.sheetRowIndex, ...item.record.slice(1)]);
}

/**
 * إضافة قطعة أرض جديدة لورقة تفاصيل المساحات.
 * @param {Array<any>} record بيانات القطعة المؤجرة.
 */
function addAreaDetail(record) {
  const ws = getDetailsSheet();
  ws.appendRow(record);
  return "تمت إضافة قطعة الأرض بنجاح";
}

/**
 * تعديل بيانات قطعة أرض موجودة.
 * @param {string} sheetRowIndex رقم الصف الفعلي في ورقة تفاصيل المساحات.
 * @param {Array<any>} record البيانات الجديدة للقطعة.
 */
function updateAreaDetail(sheetRowIndex, record) {
  const ws = getDetailsSheet();
  // ورقة التفاصيل تحتوي على 7 أعمدة: (اسم المستأجر) + (6 تفاصيل)
  ws.getRange(parseInt(sheetRowIndex), 1, 1, 7).setValues([record]); 
  return "تم تعديل بيانات قطعة الأرض بنجاح";
}

/**
 * حذف قطعة أرض من ورقة تفاصيل المساحات.
 * @param {string} sheetRowIndex رقم الصف الفعلي في ورقة تفاصيل المساحات.
 */
function deleteAreaDetail(sheetRowIndex) {
  const ws = getDetailsSheet();
  ws.deleteRow(parseInt(sheetRowIndex));
  return "تم حذف قطعة الأرض بنجاح";
}

// الوظائف الحالية للورقة الرئيسية:

function addData(record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets()[0].appendRow(record);
  return "تمت إضافة المستأجر بنجاح";
}

function deleteData(rowIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets()[0].deleteRow(parseInt(rowIndex)+2);
  return "تم حذف المستأجر بنجاح";
}

function updateData(rowIndex, record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets()[0].getRange(parseInt(rowIndex)+2,1,1,10).setValues([record]);
  return "تم تعديل بيانات المستأجر بنجاح";
}
