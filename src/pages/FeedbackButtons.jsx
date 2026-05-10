// FeedbackButtons.jsx
// 在 ImageRecognitionForm 识别结果显示后，加入这个组件
// 用法：在 ImageRecognitionForm 里的 predictions 显示区域之后插入 <FeedbackButtons ... />
//
// 需要在 FoodLogPage.jsx 里 import：
//   import FeedbackButtons from "../components/FeedbackButtons";

import { useState } from "react";
import { C } from "../theme";

const API_URL = "https://jxchan-nutribuddy.hf.space/api";

/**
 * Props:
 *   prediction  : { label, display, confidence }  — 当前选中的预测结果
 *   file        : File 对象（用户上传的图像）
 *   onDone      : () => void  — 反馈提交后的回调（可选）
 */
export default function FeedbackButtons({ prediction, file, onDone }) {
  const [status, setStatus]           = useState("idle");  // idle | correct | wrong | submitted
  const [correctName, setCorrectName] = useState("");
  const [submitting, setSubmitting]   = useState(false);

  if (!prediction || !file) return null;

  async function submitFeedback(isCorrect, correctLabel = null) {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image",         file);
      formData.append("predicted",     prediction.label);
      formData.append("is_correct",    isCorrect ? "true" : "false");
      formData.append("confidence",    String(prediction.confidence));
      if (correctLabel) {
        formData.append("correct_label", correctLabel);
      }

      await fetch(`${API_URL}/food/feedback`, {
        method: "POST",
        body:   formData,
      });

      setStatus("submitted");
      if (onDone) onDone();
    } catch (err) {
      console.error("[feedback] 提交失败:", err);
      // 静默失败 — 不影响用户体验
      setStatus("submitted");
    } finally {
      setSubmitting(false);
    }
  }

  // ── 已提交 ─────────────────────────────────────────────────────────────
  if (status === "submitted") {
    return (
      <div style={{
        marginTop: 10,
        padding: "8px 14px",
        background: "#f0f9f4",
        borderRadius: 8,
        fontSize: 13,
        color: "#0F6E56",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        ✓ 感谢你的反馈！这将帮助 NutriBuddy 变得更聪明。
      </div>
    );
  }

  // ── 用户说识别错了，要求填入正确食物名 ────────────────────────────────
  if (status === "wrong") {
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>
          这道食物的正确名称是？
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={correctName}
            onChange={(e) => setCorrectName(e.target.value)}
            placeholder="例如：Nasi Lemak、Char Kway Teow..."
            style={{
              flex: 1,
              padding: "7px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && correctName.trim()) {
                submitFeedback(false, correctName.trim().toLowerCase().replace(/\s+/g, "_"));
              }
            }}
            autoFocus
          />
          <button
            disabled={!correctName.trim() || submitting}
            onClick={() =>
              submitFeedback(false, correctName.trim().toLowerCase().replace(/\s+/g, "_"))
            }
            style={{
              padding: "7px 16px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              cursor: correctName.trim() ? "pointer" : "not-allowed",
              opacity: correctName.trim() ? 1 : 0.5,
            }}
          >
            {submitting ? "提交中..." : "提交"}
          </button>
          <button
            onClick={() => { setStatus("idle"); setCorrectName(""); }}
            style={{
              padding: "7px 12px",
              background: "transparent",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              color: C.muted,
            }}
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  // ── 初始状态：显示「正确」「错误」两个按钮 ─────────────────────────────
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
        识别结果准确吗？帮助我们改善 AI 模型
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          disabled={submitting}
          onClick={() => submitFeedback(true)}
          style={{
            flex: 1,
            padding: "8px 0",
            background: "#f0f9f4",
            border: "1.5px solid #1D9E75",
            borderRadius: 8,
            fontSize: 13,
            color: "#0F6E56",
            cursor: "pointer",
            fontWeight: 600,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#d4f0e6"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#f0f9f4"}
        >
          ✓ 正确
        </button>
        <button
          disabled={submitting}
          onClick={() => setStatus("wrong")}
          style={{
            flex: 1,
            padding: "8px 0",
            background: "#fef3f0",
            border: "1.5px solid #D85A30",
            borderRadius: 8,
            fontSize: 13,
            color: "#993C1D",
            cursor: "pointer",
            fontWeight: 600,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#fce5da"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#fef3f0"}
        >
          ✗ 不对
        </button>
      </div>
    </div>
  );
}
