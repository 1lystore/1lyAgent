"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect } from "react"

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.85)",
              zIndex: 1000,
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Modal */}
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1001,
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90vh",
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                background: "var(--bg-terminal)",
                border: "2px solid var(--accent-purple)",
                boxShadow: "0 20px 60px rgba(168, 85, 247, 0.3)",
              }}
            >
            {/* Header */}
            <div style={{
              padding: "24px 32px",
              borderBottom: "1px solid var(--border-active)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              background: "var(--bg-terminal)",
              zIndex: 10,
            }}>
              <h2 style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--accent-purple)",
                margin: 0,
                letterSpacing: "0.05em",
              }}>
                WHAT MAKES THIS UNIQUE
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-active)",
                  color: "var(--text-tertiary)",
                  fontSize: "1.5rem",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-purple)"
                  e.currentTarget.style.color = "var(--accent-purple)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-active)"
                  e.currentTarget.style.color = "var(--text-tertiary)"
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "32px" }}>
              {/* Hero Description */}
              <div style={{
                padding: "24px",
                background: "rgba(168, 85, 247, 0.05)",
                border: "1px solid var(--accent-purple)",
                marginBottom: "32px",
              }}>
                <p style={{
                  fontSize: "1.1rem",
                  lineHeight: "1.8",
                  color: "var(--text-primary)",
                  margin: 0,
                }}>
                  A <span style={{ color: "var(--accent-purple)", fontWeight: 700 }}>fully autonomous, self-sustaining AI agent</span> that monetizes its reasoning capabilities and autonomously purchases its own compute credits. Simple tasks are free, complex work requires on-chain payment via <span style={{ color: "var(--accent-solana)", fontWeight: 700 }}>1ly</span>. When running low on credits, the agent autonomously buys more using USDC — <span style={{ color: "var(--accent)", fontWeight: 700 }}>no human intervention required</span>.
                </p>
              </div>

              {/* Core Ideas */}
              <div style={{ marginBottom: "40px" }}>
                <h3 style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "var(--accent-purple)",
                  marginBottom: "24px",
                  letterSpacing: "0.05em",
                }}>
                  🤖 TWO CORE IDEAS
                </h3>

                {/* Idea 1 */}
                <div style={{
                  padding: "20px",
                  background: "rgba(20, 241, 149, 0.03)",
                  border: "1px solid var(--accent-solana)",
                  marginBottom: "20px",
                }}>
                  <h4 style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--accent-solana)",
                    marginBottom: "12px",
                  }}>
                    1. AI-Determined Pay-Per-Task Pricing
                  </h4>
                  <p style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.7",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                  }}>
                    No subscription lock-in — users pay only when they need output.
                  </p>
                  <p style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.7",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                  }}>
                    The agent itself reads the request, judges complexity, and sets the price tier automatically.
                  </p>
                  <p style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.7",
                    color: "var(--text-primary)",
                    margin: 0,
                    fontStyle: "italic",
                  }}>
                    Example: simple query → <span style={{ color: "var(--accent-solana)" }}>FREE</span>, deeper task → <span style={{ color: "var(--accent)" }}>PAID</span>
                  </p>
                </div>

                {/* Idea 2 */}
                <div style={{
                  padding: "20px",
                  background: "rgba(20, 241, 149, 0.03)",
                  border: "1px solid var(--accent-solana)",
                }}>
                  <h4 style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--accent-solana)",
                    marginBottom: "12px",
                  }}>
                    2. Self-Sustaining Agent Operations
                  </h4>
                  <p style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.7",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                  }}>
                    Agent uses earnings to auto-buy essentials (LLM credits, compute, storage, APIs).
                  </p>
                  <p style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.7",
                    color: "var(--text-primary)",
                    margin: 0,
                    fontWeight: 600,
                  }}>
                    Result: it can <span style={{ color: "var(--accent)" }}>earn</span>, <span style={{ color: "var(--accent-purple)" }}>spend</span>, and <span style={{ color: "var(--accent-solana)" }}>keep operating</span> with minimal human intervention.
                  </p>
                </div>
              </div>

              {/* Real-World Applications */}
              <div>
                <h3 style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "var(--accent-purple)",
                  marginBottom: "12px",
                  letterSpacing: "0.05em",
                }}>
                  💡 POTENTIAL APPLICATIONS
                </h3>
                <p style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginBottom: "20px",
                  lineHeight: "1.6",
                }}>
                  This demo proves the concept. Here's how this technology could be applied:
                </p>

                <div style={{ display: "grid", gap: "16px" }}>
                  {[
                    {
                      title: "Legal AI Agent",
                      desc: "Could autonomously classify: simple advice (FREE), contract review ($25), or full litigation research ($200)",
                    },
                    {
                      title: "Code Review Agent",
                      desc: "Could price based on complexity: 2-line typo fix (FREE) vs. architecture refactor (paid)",
                    },
                    {
                      title: "Financial Research",
                      desc: "Could autonomously classify: free ticker lookup vs. paid technical analysis vs. premium due diligence",
                    },
                    {
                      title: "Content Creation",
                      desc: "Could price by depth: tweet ($0) vs. blog post ($10) vs. whitepaper ($100)",
                    },
                  ].map((app, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      style={{
                        padding: "16px 20px",
                        background: "rgba(168, 85, 247, 0.05)",
                        border: "1px solid var(--border)",
                        borderLeft: "3px solid var(--accent-purple)",
                      }}
                    >
                      <div style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "var(--accent-purple)",
                        marginBottom: "8px",
                      }}>
                        • {app.title}
                      </div>
                      <div style={{
                        fontSize: "0.9rem",
                        lineHeight: "1.6",
                        color: "var(--text-secondary)",
                      }}>
                        {app.desc}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
