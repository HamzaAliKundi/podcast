import React, { useState } from "react";
import { CreditCard, Zap, Package, Crown, CheckCircle } from "lucide-react";
import { useStore } from "../store/useStore";
import { SubscriptionPlans } from "./SubscriptionPlans";

export function SubscriptionStatus() {
  const { subscription } = useStore();
  const [showPlans, setShowPlans] = useState(false);

  if (!subscription.plan) {
    return (
      <>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Upgrade Your Account
            </h3>
            <p className="text-slate-500 mb-4">
              Choose a plan to start transforming your content across platforms
            </p>
            <button onClick={() => setShowPlans(true)} className="btn-primary">
              View Plans
            </button>
          </div>
        </div>

        <SubscriptionPlans
          isOpen={showPlans}
          onClose={() => setShowPlans(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  {subscription.plan.name} Plan
                </h3>

                <p className="text-sm text-slate-500">
                  {subscription.tokensRemaining} tokens remaining
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPlans(true)}
              className="text-sm text-primary hover:text-primary-dark"
            >
              Upgrade
            </button>
          </div>
        </div>

        {/* Token Usage */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Token Usage
              </span>
              <span className="text-sm text-slate-500">
                {subscription.tokensUsed} / {subscription.plan.tokensPerMonth}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${
                    (subscription.tokensUsed /
                      subscription.plan.tokensPerMonth) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">
              Plan Features
            </h4>
            <ul className="space-y-2">
              {subscription.plan.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center text-sm text-slate-600"
                >
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <SubscriptionPlans
        isOpen={showPlans}
        onClose={() => setShowPlans(false)}
      />
    </>
  );
}
