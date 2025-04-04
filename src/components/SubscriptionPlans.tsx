import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Zap, Crown, CreditCard, ArrowRight, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

interface SubscriptionPlansProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionPlans({ isOpen, onClose }: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [step, setStep] = useState<'plans' | 'payment'>('plans');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 9.99,
      tokensPerMonth: 5,
      features: [
        '5 content pieces per month',
        'Basic AI generation',
        'Email support'
      ],
      icon: Zap,
      color: 'bg-blue-500'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 24.99,
      tokensPerMonth: 15,
      features: [
        '15 content pieces per month',
        'Advanced AI generation',
        'Priority support',
        'Custom templates'
      ],
      icon: Crown,
      color: 'bg-purple-500',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49.99,
      tokensPerMonth: 30,
      features: [
        '30 content pieces per month',
        'Premium AI generation',
        '24/7 support',
        'Custom templates',
        'API access'
      ],
      icon: CreditCard,
      color: 'bg-emerald-500'
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setStep('payment');
  };

  const handlePayment = () => {
    toast.success('Stripe integration coming soon!');
    onClose();
  };

  const renderPlans = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {plans.map((plan) => (
        <motion.div
          key={plan.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 ${
            plan.popular ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}
        >
          {plan.popular && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                Popular
              </span>
            </div>
          )}
          
          <div className={`p-6 ${plan.color} text-white`}>
            <plan.icon className="h-8 w-8 mb-4" />
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-sm opacity-80">/month</span>
            </div>
          </div>

          <div className="p-6">
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.id)}
              className={`w-full btn ${
                plan.popular ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Select Plan
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderPayment = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="max-w-md mx-auto"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className={`p-6 ${plan.color} text-white`}>
            <h3 className="text-xl font-bold mb-2">Complete Your Purchase</h3>
            <p className="opacity-80">You selected the {plan.name} plan</p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Order Summary</h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">{plan.name} Plan</span>
                  <span className="font-medium">${plan.price}/month</span>
                </div>
                <div className="text-sm text-slate-500">
                  Includes {plan.tokensPerMonth} tokens per month
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              className="w-full btn-primary"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ${plan.price}
            </button>

            <button
              onClick={() => setStep('plans')}
              className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700"
            >
              ← Back to plans
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-50 overflow-y-auto"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-50 rounded-xl shadow-xl w-full max-w-6xl relative overflow-hidden">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                      Choose Your Plan
                    </h2>
                    <p className="text-slate-600">
                      Select the perfect plan for your content transformation needs
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {step === 'plans' ? renderPlans() : renderPayment()}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}