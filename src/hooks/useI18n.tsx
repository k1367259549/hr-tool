"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type Language = "zh" | "en";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
};

type I18nProviderProps = {
  children: ReactNode;
};

const languageStorageKey = "hr-daily-ai-language";
const i18nContext = createContext<I18nContextValue | null>(null);

const translations: Record<string, string> = {
  "AI 复盘": "AI Review",
  "AI 提供商": "AI provider",
  "AI 正在分析选中的每日招聘记录。": "AI is analyzing the selected daily recruiting log.",
  "AI 正在创建选中日期的次日招聘计划。": "AI is creating the selected next-day recruiting plan.",
  "AI 知识提取失败。": "AI knowledge extraction failed.",
  "AI 知识输出无效。": "AI knowledge output is invalid.",
  "AI 生成失败。": "AI generation failed.",
  "AI 计划生成失败。": "AI plan generation failed.",
  "AI 计划输出无效。": "AI planner output is invalid.",
  "AI 计划输出日期与请求不一致。": "AI planner output date does not match request.",
  "AI 复盘生成失败。": "AI review generation failed.",
  "AI 复盘输出无效。": "AI review output is invalid.",
  "API Key": "API key",
  "HR 每日报告": "HR Daily Report",
  "Offer 数": "Offer Count",
  "Offer 率": "Offer Rate",
  "下午": "Afternoon",
  "下午任务": "Afternoon Tasks",
  "上午": "Morning",
  "上午任务": "Morning Tasks",
  "中": "Medium",
  "为选中的每日招聘记录生成并查看结构化 AI 分析。":
    "Generate and view structured AI analysis for a selected daily recruiting log.",
  "亮点": "Strengths",
  "从侧边栏选择模块即可开始使用。": "Select a module from the sidebar to start.",
  "今日汇总": "Today Summary",
  "仪表盘": "Dashboard",
  "低": "Low",
  "使用英文逗号分隔多个标签。": "Use commas to separate tags.",
  "保存修改": "Save Changes",
  "入职": "Entry",
  "入职数": "Entry Count",
  "入职率": "Entry Rate",
  "全部汇总": "All Logs Summary",
  "全部类型": "All types",
  "全局搜索": "Global Search",
  "内容": "Content",
  "创建、搜索、筛选、编辑和删除可复用的招聘知识。":
    "Create, search, filter, edit, and delete reusable recruiting knowledge.",
  "创建条目": "Create Entry",
  "创建招聘记录后即可查看漏斗转化。": "Create recruiting logs to see funnel movement.",
  "创建每日记录后，这里会显示 KPI 汇总、趋势图和漏斗概览。":
    "Create daily logs to populate KPI summaries, trend charts, and funnel overview.",
  "创建每日记录后即可生成招聘趋势数据。": "Create daily logs to populate recruiting trend data.",
  "刷新": "Refresh",
  "加载": "Load",
  "加载中...": "Loading...",
  "前端工程师": "Frontend Engineer",
  "可复用的招聘笔记和模板。": "Reusable recruiting notes and templates.",
  "取消": "Cancel",
  "只有中文和英文两种语言。": "Only Chinese and English are supported.",
  "只读的界面语言设置，保存在当前浏览器中。":
    "Read-only interface language setting saved in this browser.",
  "使用简体中文显示界面。": "Use Simplified Chinese for the interface.",
  "可见界面会立即切换语言。": "The visible interface updates immediately.",
  "后端错误和 AI 输出内容不会被自动翻译。":
    "Backend errors and AI-generated content are not translated automatically.",
  "中文": "Chinese",
  "向下选择语言": "Select language",
  "启用语言": "Active language",
  "周": "Week",
  "和": "and",
  "响应": "Response",
  "基准": "Base",
  "夜间": "Evening",
  "晚上": "Evening",
  "晚上任务": "Evening Tasks",
  "大": "Large",
  "完成": "Done",
  "应用信息": "Application Info",
  "应用名称": "App name",
  "应用已准备就绪": "Application ready",
  "当前 UTC 周的招聘表现。": "Current UTC week recruiting performance.",
  "当前 UTC 日期的招聘表现。": "Current UTC day recruiting performance.",
  "当前 UTC 月的招聘表现。": "Current UTC month recruiting performance.",
  "当前范围": "Selected range",
  "当前还没有可展示的内容。": "There is nothing to show right now.",
  "所有已保存的招聘记录。": "All saved recruiting logs.",
  "打开": "Open",
  "招聘工作台": "Recruiting OS",
  "招聘漏斗": "Recruiting Funnel",
  "搜索": "Search",
  "搜索中": "Searching",
  "搜索关键词": "Search keyword",
  "搜索并筛选可复用的招聘知识条目。":
    "Search and filter reusable recruiting knowledge entries.",
  "搜索已就绪": "Search is ready",
  "搜索标题或内容": "Search title or content",
  "搜索每日招聘记录和可复用知识条目。":
    "Search daily recruiting logs and reusable knowledge entries.",
  "数据库提供商": "Database provider",
  "数据库状态": "Database Status",
  "数据库请求失败。": "Database request failed.",
  "文档": "Docs",
  "新建": "New",
  "日期": "Date",
  "日期为必填项。": "Date is required.",
  "日期必须是有效日期。": "Date must be a valid date.",
  "日程": "Schedule",
  "日语": "Japanese",
  "明日计划": "Tomorrow Planner",
  "暂无已安排任务。": "No tasks scheduled.",
  "暂无数据": "No data yet",
  "暂无日程。": "No schedule provided.",
  "暂无条目。": "No items provided.",
  "暂无标签": "No tags",
  "暂无漏斗数据": "No funnel data",
  "暂无计划": "No plan yet",
  "暂无记录": "No logs yet",
  "暂无趋势数据": "No trend data",
  "暂无预览。": "No preview available.",
  "暂无页面": "No page",
  "智能": "Smart",
  "未找到前一天的每日记录。": "Previous day log not found.",
  "未找到复盘。": "Review not found.",
  "未找到每日记录。": "Log not found.",
  "未找到知识条目": "No knowledge entries found",
  "未找到知识条目。": "Knowledge entry not found.",
  "未找到结果": "No results found",
  "未找到计划。": "Plan not found.",
  "未连接": "Disconnected",
  "本周汇总": "Weekly Summary",
  "本月汇总": "Monthly Summary",
  "条记录": "logs",
  "查看只读的系统、AI、数据库和环境配置状态。":
    "View read-only system, AI, database, and environment configuration status.",
  "查看招聘 KPI 汇总、漏斗转化和近期表现趋势。":
    "Visualize recruiting KPI summaries, funnel movement, and recent performance trends.",
  "标签": "Tags",
  "标题": "Title",
  "模板": "Template",
  "正在创建": "Creating",
  "正在保存...": "Saving...",
  "正在删除...": "Deleting...",
  "正在加载": "Loading",
  "正在加载仪表盘": "Loading dashboard",
  "正在加载复盘": "Loading review",
  "正在加载知识": "Loading knowledge",
  "正在加载记录": "Loading logs",
  "正在加载设置": "Loading settings",
  "正在加载计划": "Loading plan",
  "正在导出": "Exporting",
  "正在提取": "Extracting",
  "正在检查是否已有保存的 AI 复盘。": "Checking for a saved AI review.",
  "正在检查是否已有保存的计划。": "Checking for a saved plan.",
  "正在检查配置状态。": "Checking configuration status.",
  "正在检索记录和知识条目。": "Looking across logs and knowledge entries.",
  "正在获取 KPI 汇总和近期趋势。": "Fetching KPI summaries and recent trends.",
  "正在获取每日招聘记录。": "Fetching daily recruiting logs.",
  "正在获取知识条目。": "Fetching knowledge entries.",
  "正在生成复盘": "Generating review",
  "正在生成计划": "Generating plan",
  "正在保存": "Saving",
  "正在删除": "Deleting",
  "正在处理": "Working",
  "此操作无法撤销。": "This action cannot be undone.",
  "每日记录": "Daily Log",
  "每日记录已保存。": "Daily log saved.",
  "每日记录已删除。": "Daily log deleted.",
  "每日评分": "Daily Score",
  "每日复盘": "Daily Review",
  "沟通": "Contact",
  "清空": "Clear",
  "版本": "Version",
  "环境": "Environment",
  "环境状态": "Environment Status",
  "用户": "User",
  "电话沟通": "Phone",
  "电话沟通数": "Phone Count",
  "知识": "Knowledge",
  "知识列表": "Knowledge List",
  "知识库": "Knowledge Base",
  "知识条目已创建。": "Knowledge entry created.",
  "知识条目已删除。": "Knowledge entry deleted.",
  "知识条目已更新。": "Knowledge entry updated.",
  "知识筛选": "Knowledge Filters",
  "表格上传": "Spreadsheet Upload",
  "表格分析": "Spreadsheet Analysis",
  "表格预览": "Spreadsheet Preview",
  "上传 .xlsx 或 .csv 文件，后端会解析数据并生成 AI 招聘分析报告。":
    "Upload a .xlsx or .csv file. The backend will parse it and generate an AI recruiting analysis report.",
  "上传 Excel 或 CSV 招聘数据，生成 AI HR 分析报告。":
    "Upload Excel or CSV recruiting data to generate an AI HR analysis report.",
  "上传并分析": "Upload and Analyze",
  "上传分析失败。": "Upload analysis failed.",
  "上传并分析文件后会显示解析结果。": "Parsed results appear after uploading and analyzing a file.",
  "上传表格并完成 AI 分析后，报告会显示在这里。":
    "The report appears here after the spreadsheet upload and AI analysis finish.",
  "无法分析表格": "Unable to analyze spreadsheet",
  "正在分析表格": "Analyzing spreadsheet",
  "后端正在解析文件并调用 AI 生成报告。":
    "The backend is parsing the file and calling AI to generate a report.",
  "选择 Excel 或 CSV 文件": "Select an Excel or CSV file",
  "支持 .xlsx 和 .csv，文件大小不超过 10MB。":
    "Supports .xlsx and .csv files up to 10MB.",
  "暂无表格预览": "No spreadsheet preview",
  "暂无分析报告": "No analysis report",
  "共解析": "Parsed",
  "行数据。": "rows.",
  "文件名": "File Name",
  "文件类型": "File Type",
  "数据行数": "Rows",
  "洞察": "Insights",
  "分析中...": "Analyzing...",
  "请先选择文件。": "Select a file first.",
  "请上传文件。": "Upload a file.",
  "文件大小不能超过 10MB。": "File size must not exceed 10MB.",
  "仅支持 .xlsx 或 .csv 文件。": "Only .xlsx and .csv files are supported.",
  "表格没有可分析的数据行。": "The spreadsheet has no analyzable rows.",
  "CSV 文件解析失败。": "CSV parsing failed.",
  "Excel 文件没有工作表。": "The Excel file has no worksheet.",
  "Excel 工作表读取失败。": "Failed to read the Excel worksheet.",
  "Excel 文件解析失败。": "Excel parsing failed.",
  "AI 表格分析失败。": "AI spreadsheet analysis failed.",
  "AI 表格分析输出无效。": "AI spreadsheet analysis output is invalid.",
  "AI 表格分析输出不符合 schema。": "AI spreadsheet analysis output does not match schema.",
  "未找到上传记录。": "Upload record not found.",
  "确定删除选中的每日记录吗？此操作无法撤销。":
    "Delete the selected daily log? This action cannot be undone.",
  "确认": "Confirm",
  "简历": "Resume",
  "简历数": "Resume Count",
  "筛选": "Screen",
  "筛选数": "Screen Count",
  "筛选率": "Screen Rate",
  "系统配置无效。": "System configuration is invalid.",
  "结果": "Results",
  "编辑": "Edit",
  "职位": "Position",
  "聚焦方向": "Focus Area",
  "自动": "Auto",
  "英文": "English",
  "英语": "English",
  "获取失败": "Failed to fetch",
  "设置": "Settings",
  "计划已生成。": "Plan generated.",
  "计划优先级": "Plan Priority",
  "记录历史": "Log History",
  "语言": "Language",
  "语言设置": "Language Settings",
  "界面语言": "Interface language",
  "请求体必须是 JSON 对象。": "Request body must be a JSON object.",
  "请求体必须是有效 JSON。": "Request body must be valid JSON.",
  "请求失败。": "Request failed.",
  "资源不存在。": "Resource not found.",
  "输入关键词": "Search by keyword",
  "运行时": "Runtime",
  "过滤": "Filter",
  "返回": "Back",
  "选择已有记录进行查看或编辑。": "Select an existing log to view or edit it.",
  "选择每日记录日期，加载已保存的 AI 复盘，或生成新的分析。":
    "Select a daily log date, load any saved AI review, or generate a fresh analysis.",
  "选择目标日期，加载已保存的计划，或生成新的次日计划。":
    "Select a target date, load any saved plan, or generate a fresh next-day plan.",
  "选择语言": "Select language",
  "通过": "Passed",
  "部署方式": "Deployment",
  "配置模型": "Configured model",
  "配置模式": "Configuration mode",
  "重新生成复盘": "Regenerate Review",
  "重新生成计划": "Regenerate Plan",
  "重要任务": "Priority Tasks",
  "重点任务": "Priority Tasks",
  "重点方向": "Focus Area",
  "钩子": "Hooks",
  "错误": "Error",
  "问题": "Problems",
  "面向桌面端的招聘运营工作台，用于每日记录、KPI 查看、AI 复盘、计划生成和知识沉淀。":
    "A desktop-first recruiting operations shell for daily logs, KPI visibility, AI review, planning, and reusable knowledge.",
  "面试": "Interview",
  "面试数": "Interview Count",
  "面试率": "Interview Rate",
  "项目": "Project",
  "预期结果": "Expected Outcomes",
  "高": "High",
  "无法保存知识": "Unable to save knowledge",
  "无法加载 AI 复盘": "Unable to load AI review",
  "无法加载仪表盘": "Unable to load dashboard",
  "无法加载知识库": "Unable to load knowledge",
  "无法加载设置": "Unable to load settings",
  "无法加载计划": "Unable to load planner",
  "无法完成搜索": "Unable to search",
  "无法保存记录": "Unable to save log",
  "无": "None",
  "无。": "None.",
  "无效": "Invalid",
  "有效": "Valid",
  "存在": "Exists",
  "缺失": "Missing",
  "已包含": "Present",
  "已配置": "Configured",
  "已连接": "Connected",
  "提示词": "Prompt",
  "提示词文件缺失。": "Prompt file is missing.",
  "提示词文件为空。": "Prompt file is empty.",
  "提示词缺少 {{INPUT}} 占位符。": "Prompt is missing {{INPUT}} placeholder.",
  "提示词没有明确要求仅输出 JSON。": "Prompt does not clearly require JSON-only output.",
  "提示词状态": "Prompt Status",
  "提示词目录": "Prompt directory",
  "必需提示词文件的只读校验状态。": "Read-only validation status for required prompt files.",
  "路径": "Path",
  "警告": "Warnings",
  "输入占位符": "Input",
  "关闭": "Dismiss",
  "删除": "Delete",
  "保存": "Save",
  "创建或更新一条结构化招聘记录。": "Create or update one structured recruiting log.",
  "为选中日期创建或更新一条结构化招聘记录。":
    "Create or update one structured recruiting log for a selected date.",
  "沉淀结构化招聘知识，便于后续复用。":
    "Store structured recruiting knowledge for future reference.",
  "请选择前一天已有招聘记录的目标日期，然后生成计划。":
    "Select a target date with previous-day recruiting data, then generate a plan.",
  "请选择已有每日记录的日期，然后生成 AI 复盘。":
    "Select a date with a daily log, then generate an AI review.",
  "请先在表单中创建第一条每日记录。": "Create the first daily log from the form.",
  "请先选择日期再导出。": "Select a date before exporting.",
  "请稍后重试。": "Please try again.",
  "页面出错": "Page error",
  "页面渲染时出现问题，请重试。":
    "Something went wrong while rendering this page. Please retry the action.",
  "重试": "Retry",
  "导出 Markdown": "Export Markdown",
  "导出失败。": "Export failed.",
  "Markdown 已复制到剪贴板。": "Markdown copied to clipboard.",
  "出错了": "Something went wrong",
  "内容准备中，请稍候。": "Please wait while the content is prepared."
};

const reverseTranslations = Object.fromEntries(
  Object.entries(translations).map(([source, translated]) => [translated, source])
) as Record<string, string>;

export function I18nProvider({ children }: I18nProviderProps): JSX.Element {
  const [language, setLanguageState] = useState<Language>("zh");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(languageStorageKey);

    if (savedLanguage === "zh" || savedLanguage === "en") {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  useEffect(() => {
    const translateDocument = (): void => {
      translateElement(document.body, language);
    };

    translateDocument();

    const observer = new MutationObserver(() => {
      translateDocument();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language): void => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
  }, []);

  const t = useCallback(
    (text: string): string => {
      if (language === "zh") {
        return text;
      }

      return translations[text] ?? text;
    },
    [language]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t
    }),
    [language, setLanguage, t]
  );

  return <i18nContext.Provider value={contextValue}>{children}</i18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const contextValue = useContext(i18nContext);

  if (!contextValue) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return contextValue;
}

function translateElement(root: HTMLElement, language: Language): void {
  const dictionary = language === "zh" ? reverseTranslations : translations;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const originalText = node.textContent ?? "";
    const trimmedText = originalText.trim();
    const translatedText = dictionary[trimmedText];

    if (translatedText) {
      const nextText = originalText.replace(trimmedText, translatedText);

      if (node.textContent !== nextText) {
        node.textContent = nextText;
      }
    }

    node = walker.nextNode();
  }

  const elements = root.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]");

  elements.forEach((element) => {
    translateAttribute(element, "placeholder", dictionary);
    translateAttribute(element, "aria-label", dictionary);
    translateAttribute(element, "title", dictionary);
  });
}

function translateAttribute(
  element: HTMLElement,
  attribute: "placeholder" | "aria-label" | "title",
  dictionary: Record<string, string>
): void {
  const value = element.getAttribute(attribute);

  if (!value) {
    return;
  }

  const translatedValue = dictionary[value.trim()];

  if (translatedValue) {
    if (value !== translatedValue) {
      element.setAttribute(attribute, translatedValue);
    }
  }
}
