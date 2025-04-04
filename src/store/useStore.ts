import { create } from "zustand";
import { ContentSource, ContentOutput, TransformationOptions } from "../types";
import {
  supabase,
  createContentSource,
  updateContentStatus,
  addProcessingHistory,
  saveGeneratedContent,
  getGeneratedContent,
  signInWithEmail,
  signUp,
  signOut,
  getContentSources,
} from "../services/supabase";
import toast from "react-hot-toast";

interface Store {
  sources: ContentSource[];
  outputs: ContentOutput[];
  selectedSource: ContentSource | null;
  selectedContent: {
    type: "video" | "playlist" | null;
    item: any;
  };
  isLoading: boolean;
  error: string | null;
  user: any | null;
  processingQueue: string[];
  isProcessing: boolean;
  subscription: {
    plan: {
      name: string;
      price: number;
      tokensPerMonth: number;
      features: string[];
    } | null;
    tokensUsed: number;
    tokensRemaining: number;
    status: "active" | "canceled" | "past_due";
  };
  addSource: (source: Omit<ContentSource, "id" | "createdAt">) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  updateSourceStatus: (
    id: string,
    status: ContentSource["status"]
  ) => Promise<void>;
  selectSource: (id: string) => void;
  selectContent: (type: "video" | "playlist" | null, item: any) => void;
  clearSelectedContent: () => void;
  addOutput: (output: Omit<ContentOutput, "id" | "createdAt">) => Promise<void>;
  removeOutput: (id: string) => void;
  loadSources: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  startProcessing: (sourceId: string) => Promise<boolean>;
  endProcessing: (sourceId: string) => void;
  getProcessingStatus: (sourceId: string) => "queued" | "processing" | "idle";
  loadSubscription: () => Promise<void>;
}

const useStore = create<Store>((set, get) => ({
  sources: [],
  outputs: [],
  selectedSource: null,
  selectedContent: {
    type: null,
    item: null,
  },
  isLoading: false,
  error: null,
  user: null,
  processingQueue: [],
  isProcessing: false,
  subscription: {
    plan: null,
    tokensUsed: 0,
    tokensRemaining: 0,
    status: "canceled",
  },

  selectContent: (type, item) => {
    set({ selectedContent: { type, item } });
  },

  clearSelectedContent: () => {
    set({ selectedContent: { type: null, item: null } });
  },

  startProcessing: async (sourceId: string) => {
    const state = get();

    // Check if already processing
    if (state.isProcessing) {
      const queuePosition = state.processingQueue.indexOf(sourceId);
      if (queuePosition === -1) {
        set((state) => ({
          processingQueue: [...state.processingQueue, sourceId],
        }));
        toast.info("Added to processing queue");
      }
      return false;
    }

    // Start processing
    set((state) => ({
      isProcessing: true,
      processingQueue: [sourceId, ...state.processingQueue],
    }));
    return true;
  },

  endProcessing: (sourceId: string) => {
    set((state) => {
      const newQueue = state.processingQueue.filter((id) => id !== sourceId);
      return {
        isProcessing: newQueue.length > 0,
        processingQueue: newQueue,
      };
    });
  },

  getProcessingStatus: (sourceId: string) => {
    const state = get();
    if (state.processingQueue[0] === sourceId) return "processing";
    if (state.processingQueue.includes(sourceId)) return "queued";
    return "idle";
  },

  checkAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ user: session?.user || null });

      if (session?.user) {
        // Load sources if user is authenticated
        get().loadSources();
        get().loadSubscription();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await signInWithEmail(email, password);
      set({ user });
      toast.success("Signed in successfully");
      get().loadSources();
      get().loadSubscription();
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to sign in");
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await signUp(email, password);
      set({ user });
      toast.success("Account created successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to create account");
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await signOut();
      set({
        user: null,
        sources: [],
        selectedSource: null,
        selectedContent: {
          type: null,
          item: null,
        },
        subscription: {
          plan: null,
          tokensUsed: 0,
          tokensRemaining: 0,
          status: "canceled",
        },
      });
      toast.success("Signed out successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to sign out");
    } finally {
      set({ isLoading: false });
    }
  },

  loadSources: async () => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const sources = await getContentSources();
      set({ sources: sources || [] });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to load sources");
    } finally {
      set({ isLoading: false });
    }
  },

  addSource: async (source) => {
    const { user } = get();
    if (!user) {
      toast.error("Please sign in to add sources");
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await createContentSource({
        type: source.type,
        metadata: source.metadata,
      });

      if (!data) {
        throw new Error("Failed to create content source");
      }

      set((state) => ({
        sources: [data, ...state.sources],
        selectedSource: data,
      }));

      await addProcessingHistory({
        sourceId: data.id,
        action: "import",
        status: "success",
        details: `Added new ${source.type} content source`,
      });

      toast.success("Source added successfully");
    } catch (error: any) {
      console.error("Error adding source:", error);
      set({ error: error.message });
      toast.error(error.message || "Failed to add source");
    } finally {
      set({ isLoading: false });
    }
  },

  removeSource: async (id) => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from("content_sources")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      set((state) => ({
        sources: state.sources.filter((source) => source.id !== id),
        selectedSource:
          state.selectedSource?.id === id ? null : state.selectedSource,
        selectedContent:
          state.selectedSource?.id === id
            ? { type: null, item: null }
            : state.selectedContent,
      }));

      toast.success("Source removed successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to remove source");
    } finally {
      set({ isLoading: false });
    }
  },

  updateSourceStatus: async (id, status) => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("content_sources")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        sources: state.sources.map((source) =>
          source.id === id ? { ...source, status } : source
        ),
        selectedSource:
          state.selectedSource?.id === id
            ? { ...state.selectedSource, status }
            : state.selectedSource,
      }));

      await addProcessingHistory({
        sourceId: id,
        action: "status_update",
        status: "success",
        details: `Updated status to ${status}`,
      });

      toast.success("Status updated successfully");
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to update status");
    } finally {
      set({ isLoading: false });
    }
  },

  selectSource: (id) => {
    const source = get().sources.find((source) => source.id === id);
    set({
      selectedSource: source || null,
      selectedContent: { type: null, item: null }, // Reset selected content when changing source
    });
  },

  addOutput: async (output) => {
    const { selectedSource } = get();
    if (!selectedSource) return;

    try {
      const savedContent = await saveGeneratedContent({
        sourceId: selectedSource.id,
        content: output.content,
        metadata: {
          type: output.type,
          format: output.format,
          generatedAt: new Date().toISOString(),
        },
      });

      set((state) => ({
        outputs: [
          ...state.outputs,
          {
            ...output,
            id: savedContent.id,
            createdAt: new Date(savedContent.created_at),
          },
        ],
      }));

      await addProcessingHistory({
        sourceId: selectedSource.id,
        action: "transform",
        status: "success",
        details: `Generated ${output.type} content`,
      });
    } catch (error: any) {
      toast.error("Failed to save generated content");
      throw error;
    }
  },

  removeOutput: (id) => {
    set((state) => ({
      outputs: state.outputs.filter((output) => output.id !== id),
    }));
  },

  loadSubscription: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // First, get token usage (regardless of subscription plan)
      const { data: tokenUsage } = await supabase
        .from("content_tokens")
        .select("tokens_used")
        .eq("user_id", user.id);

      const totalTokensUsed =
        tokenUsage?.reduce(
          (sum, record) => sum + (record.tokens_used || 0),
          0
        ) || 0;

      // Try to get subscription data
      const { data: subscription, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select(
          `
          *,
          subscription_plans (*)
        `
        )
        .eq("user_id", user.id)
        .single();

      // If no subscription exists, use a default free tier
      if (subscriptionError && subscriptionError.code === "PGRST116") {
        set({
          subscription: {
            plan: {
              name: "Free",
              price: 0,
              tokensPerMonth: 10000,
              features: ["Limited access", "Basic features"],
            },
            tokensUsed: totalTokensUsed,
            tokensRemaining: 10000 - totalTokensUsed,
            status: "active",
          },
        });
        return;
      }

      if (subscription) {
        set({
          subscription: {
            plan: {
              name: subscription.subscription_plans.name,
              price: subscription.subscription_plans.price,
              tokensPerMonth: subscription.subscription_plans.tokens_per_month,
              features: subscription.subscription_plans.features.features,
            },
            tokensUsed: totalTokensUsed,
            tokensRemaining:
              subscription.subscription_plans.tokens_per_month -
              totalTokensUsed,
            status: subscription.status,
          },
        });
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      // Set default free tier on error, but still try to get token usage
      try {
        const { data: tokenUsage } = await supabase
          .from("content_tokens")
          .select("tokens_used")
          .eq("user_id", user.id);

        const totalTokensUsed =
          tokenUsage?.reduce(
            (sum, record) => sum + (record.tokens_used || 0),
            0
          ) || 0;

        set({
          subscription: {
            plan: {
              name: "Free",
              price: 0,
              tokensPerMonth: 10000,
              features: ["Limited access", "Basic features"],
            },
            tokensUsed: totalTokensUsed,
            tokensRemaining: 10000 - totalTokensUsed,
            status: "active",
          },
        });
      } catch (tokenError) {
        // If even token usage fails, set defaults
        set({
          subscription: {
            plan: {
              name: "Free",
              price: 0,
              tokensPerMonth: 10000,
              features: ["Limited access", "Basic features"],
            },
            tokensUsed: 0,
            tokensRemaining: 10000,
            status: "active",
          },
        });
      }
    }
  },
  // loadSubscription: async () => {
  //   const { user } = get();
  //   if (!user) return;

  //   try {
  //     const { data: subscription, error: subscriptionError } = await supabase
  //       .from("user_subscriptions")
  //       .select(
  //         `
  //         *,
  //         subscription_plans (*)
  //       `
  //       )
  //       .eq("user_id", user.id)
  //       .single();

  //     // If no subscription exists, use a default free tier
  //     if (subscriptionError && subscriptionError.code === "PGRST116") {
  //       set({
  //         subscription: {
  //           plan: {
  //             name: "Free",
  //             price: 0,
  //             tokensPerMonth: 1000,
  //             features: ["Limited access", "Basic features"],
  //           },
  //           tokensUsed: 0,
  //           tokensRemaining: 1000,
  //           status: "active",
  //         },
  //       });
  //       return;
  //     }

  //     if (subscription) {
  //       const { data: tokenUsage } = await supabase
  //         .from("content_tokens")
  //         .select("tokens_used")
  //         .eq("user_id", user.id);

  //       const totalTokensUsed =
  //         tokenUsage?.reduce((sum, record) => sum + record.tokens_used, 0) || 0;

  //       set({
  //         subscription: {
  //           plan: {
  //             name: subscription.subscription_plans.name,
  //             price: subscription.subscription_plans.price,
  //             tokensPerMonth: subscription.subscription_plans.tokens_per_month,
  //             features: subscription.subscription_plans.features.features,
  //           },
  //           tokensUsed: totalTokensUsed,
  //           tokensRemaining:
  //             subscription.subscription_plans.tokens_per_month -
  //             totalTokensUsed,
  //           status: subscription.status,
  //         },
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error loading subscription:", error);
  //     // Set default free tier on error
  //     set({
  //       subscription: {
  //         plan: {
  //           name: "Free",
  //           price: 0,
  //           tokensPerMonth: 1000,
  //           features: ["Limited access", "Basic features"],
  //         },
  //         tokensUsed: 0,
  //         tokensRemaining: 1000,
  //         status: "active",
  //       },
  //     });
  //   }
  // },
}));

// Initialize auth check
useStore.getState().checkAuth();

export { useStore };
