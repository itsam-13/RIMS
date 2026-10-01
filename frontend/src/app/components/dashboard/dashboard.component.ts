import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InventoryApiService } from '../../services/inventory-api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import {
  Product,
  Warehouse,
  Inventory,
  PurchaseOrder,
  CustomerOrder,
  StockMovement
} from '../../models/inventory.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bento-dashboard">
      <!-- 2-COLUMN BENTO GRID MATCHING REFERENCE IMAGE 2 -->
      <div class="bento-grid">

        <!-- ==========================================
             ROW 1: GREETING CARD + WEATHER/CLIMATE CARD
             ========================================== -->
        <!-- 1. GREETING & SPARKLINE CARD -->
        <div class="bento-card card-greeting">
          <div class="card-header-line">
            <div class="greeting-kicker">{{ getGreeting() }},</div>
            <div class="time-pill mono">{{ liveTime() }}</div>
          </div>
          <h1 class="greeting-name">{{ authService.currentUser()?.username || 'Aaru' }}</h1>
          <p class="greeting-sub">Stay focused and keep the inventory flowing.</p>

          <!-- Glowing Blue/Mint Sparkline Wave -->
          <div class="wave-container">
            <svg viewBox="0 0 400 90" class="neon-wave-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
                  <stop offset="50%" stop-color="#8EB69B" stop-opacity="0.9" />
                  <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.4" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <!-- Filled area -->
              <path
                d="M0,70 Q50,60 100,75 T200,45 T300,30 T400,65 L400,90 L0,90 Z"
                fill="url(#waveGrad)"
                opacity="0.12"
              />
              <!-- Neon Curve -->
              <path
                d="M0,70 Q50,60 100,75 T200,45 T300,30 T400,65"
                fill="none"
                stroke="url(#waveGrad)"
                stroke-width="3"
                filter="url(#glow)"
              />
              <!-- Data Points with Glow -->
              <circle cx="100" cy="75" r="4" fill="#DAF1DE" filter="url(#glow)" />
              <circle cx="200" cy="45" r="4" fill="#DAF1DE" filter="url(#glow)" />
              <circle cx="300" cy="30" r="4.5" fill="#DAF1DE" filter="url(#glow)" />
            </svg>
          </div>
        </div>

        <!-- 2. DATE & FACILITY CLIMATE CARD -->
        <div class="bento-card card-climate">
          <div class="climate-date">{{ currentDateFormatted() }}</div>
          <div class="climate-day">{{ currentDayName() }}</div>

          <div class="climate-weather-row">
            <div class="weather-icon-box">
              <i class="ri-sun-cloudy-line"></i>
            </div>
            <div class="weather-temp">
              21<span class="temp-unit">°C</span>
            </div>
          </div>
          <div class="climate-condition">Climate Control Optimal</div>
          <div class="climate-range mono">H: 24° &nbsp; L: 18° &nbsp; Humidity: 45%</div>
        </div>

        <!-- ==========================================
             ROW 2: PRODUCTIVITY RING + FOCUS TIMER
             ========================================== -->
        <!-- 3. PRODUCTIVITY / FULFILLMENT GAUGE CARD -->
        <div class="bento-card card-productivity">
          <div class="card-header-line">
            <div class="card-title">Fulfillment Rate</div>
            <div class="card-dropdown">Today <i class="ri-arrow-down-s-line"></i></div>
          </div>

          <div class="prod-content">
            <div class="prod-left">
              <div class="prod-large-percent">{{ fulfillmentRate() }}%</div>
              <div class="prod-label">Great Progress!</div>
              <div class="prod-metrics-duo">
                <div>
                  <div class="metric-caption">Orders Fulfilled</div>
                  <div class="metric-num mono">{{ completedOrderCount() }}</div>
                </div>
                <div>
                  <div class="metric-caption">Total Orders</div>
                  <div class="metric-num mono">{{ totalCustomerOrders() }}</div>
                </div>
              </div>
            </div>

            <!-- Glowing Circular Ring Gauge -->
            <div class="prod-ring-box">
              <svg viewBox="0 0 100 100" class="ring-svg">
                <circle cx="50" cy="50" r="40" class="ring-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  class="ring-progress ring-blue-grad"
                  [attr.stroke-dasharray]="251.2"
                  [attr.stroke-dashoffset]="251.2 - (251.2 * fulfillmentRate()) / 100"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- 4. FOCUS TIMER / REORDER CYCLE CARD -->
        <div class="bento-card card-timer">
          <div class="card-header-line">
            <div class="card-title">Reorder Cycle</div>
            <div class="status-indicator-dot"></div>
          </div>

          <!-- Circular Orange Countdown Gauge -->
          <div class="timer-ring-wrapper">
            <svg viewBox="0 0 120 120" class="timer-svg">
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fb923c" />
                  <stop offset="100%" stop-color="#f87171" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" class="timer-ring-bg" />
              <circle
                cx="60"
                cy="60"
                r="50"
                class="timer-ring-val"
                stroke="url(#timerGrad)"
                [attr.stroke-dasharray]="314.15"
                [attr.stroke-dashoffset]="314.15 - (314.15 * (timerSeconds / 1500))"
              />
            </svg>
            <div class="timer-digits">
              <div class="digits-val mono">{{ formatTimer() }}</div>
              <div class="digits-sub">Deep Audit</div>
            </div>
          </div>

          <div style="display: flex; justify-content: center; margin-top: 0.75rem;">
            <button class="btn btn-secondary btn-sm" (click)="toggleTimer()">
              <i [class]="isTimerRunning ? 'ri-pause-line' : 'ri-play-fill'" style="color: var(--accent-orange);"></i>
              <span>{{ isTimerRunning ? 'Pause Sweep' : 'Start Sweep' }}</span>
            </button>
          </div>
        </div>

        <!-- ==========================================
             ROW 3: TASKS CHECKLIST + SYSTEM PULSE WAVE
             ========================================== -->
        <!-- 5. TASKS / ACTIONS CHECKLIST CARD -->
        <div class="bento-card card-tasks">
          <div class="card-header-line">
            <div class="card-title">Operations Priority</div>
            <button class="icon-add-btn" routerLink="/purchase-orders" title="New Task">
              <i class="ri-add-line"></i>
            </button>
          </div>

          <div class="tasks-list">
            <div class="task-row">
              <div class="task-checkbox checked">
                <i class="ri-check-line"></i>
              </div>
              <div class="task-name">Central Hub Inventory Sync</div>
              <span class="task-tag tag-completed">Completed</span>
            </div>

            <div class="task-row">
              <div class="task-checkbox checked">
                <i class="ri-check-line"></i>
              </div>
              <div class="task-name">Verify Inbound PO-102 Shipments</div>
              <span class="task-tag tag-completed">Completed</span>
            </div>

            <div class="task-row">
              <div class="task-checkbox in-progress">
                <div class="in-progress-dot"></div>
              </div>
              <div class="task-name">Restock {{ lowStockProducts().length }} Low-Stock SKUs</div>
              <span class="task-tag tag-progress">In Progress</span>
            </div>

            <div class="task-row">
              <div class="task-checkbox pending"></div>
              <div class="task-name">Warehouse Capacity Safety Audit</div>
              <span class="task-tag tag-pending">Pending</span>
            </div>
          </div>
        </div>

        <!-- 6. CURRENT MOOD / SYSTEM PULSE CARD -->
        <div class="bento-card card-pulse">
          <div class="card-header-line">
            <div class="card-title">Network Pulse</div>
          </div>
          <div class="pulse-status-line">
            <span class="pulse-state">Optimal Throughput</span>
          </div>

          <!-- Vibrant Cyan/Blue/Pink Sine Wave -->
          <div class="pulse-wave-box">
            <svg viewBox="0 0 350 70" class="pulse-sine-svg">
              <defs>
                <linearGradient id="sineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#38bdf8" />
                  <stop offset="50%" stop-color="#8EB69B" />
                  <stop offset="100%" stop-color="#c084fc" />
                </linearGradient>
                <filter id="sineGlow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M 10 35 Q 90 10, 175 35 T 340 35"
                fill="none"
                stroke="url(#sineGrad)"
                stroke-width="3"
                filter="url(#sineGlow)"
              />
            </svg>
          </div>

          <div class="pulse-footer">
            <div class="pulse-footer-label">Fleet Latency</div>
            <div class="pulse-footer-val" style="color: var(--c-mint-sage);">Minimal (12ms)</div>
          </div>
        </div>

        <!-- ==========================================
             ROW 4: WEEKLY ACTIVITY + SHORTCUTS GRID
             ========================================== -->
        <!-- 7. WEEKLY ACTIVITY CAPSULE BAR CHART -->
        <div class="bento-card card-activity">
          <div class="card-header-line">
            <div class="card-title">Weekly Dispatch Volume</div>
            <div class="card-dropdown">This Week <i class="ri-arrow-down-s-line"></i></div>
          </div>

          <div class="bar-chart-container">
            <div class="bar-column" *ngFor="let b of weeklyBars">
              <div class="bar-pill-track">
                <!-- Tooltip above active bar -->
                <div class="active-bar-badge mono" *ngIf="b.active">
                  {{ b.val }} units
                </div>
                <div
                  class="bar-pill-fill"
                  [class.bar-active]="b.active"
                  [style.height.%]="b.height"
                ></div>
              </div>
              <span class="bar-day" [class.day-active]="b.active">{{ b.day }}</span>
            </div>
          </div>
        </div>

        <!-- 8. SHORTCUTS GRID CARD -->
        <div class="bento-card card-shortcuts">
          <div class="card-header-line">
            <div class="card-title">Quick Action Hub</div>
          </div>

          <div class="shortcuts-grid">
            <a routerLink="/purchase-orders" class="shortcut-box">
              <div class="sc-icon"><i class="ri-truck-line"></i></div>
              <span class="sc-label">New PO</span>
            </a>

            <a routerLink="/customer-orders" class="shortcut-box">
              <div class="sc-icon"><i class="ri-shopping-cart-line"></i></div>
              <span class="sc-label">Sales Order</span>
            </a>

            <a routerLink="/stock-movements" class="shortcut-box">
              <div class="sc-icon"><i class="ri-arrow-left-right-line"></i></div>
              <span class="sc-label">Transfer</span>
            </a>

            <a routerLink="/inventory" class="shortcut-box">
              <div class="sc-icon"><i class="ri-edit-line"></i></div>
              <span class="sc-label">Audit Count</span>
            </a>

            <a routerLink="/products" class="shortcut-box">
              <div class="sc-icon"><i class="ri-box-3-line"></i></div>
              <span class="sc-label">Catalog</span>
            </a>

            <a routerLink="/warehouses" class="shortcut-box">
              <div class="sc-icon"><i class="ri-building-line"></i></div>
              <span class="sc-label">Facilities</span>
            </a>
          </div>
        </div>

        <!-- ==========================================
             ROW 5: UPCOMING INBOUND SHIPMENTS + SYSTEM STATUS
             ========================================== -->
        <!-- 9. UPCOMING INBOUND SHIPMENTS SCHEDULE -->
        <div class="bento-card card-events">
          <div class="card-header-line">
            <div class="card-title">Inbound Deliveries</div>
            <a routerLink="/purchase-orders" class="card-link">View All</a>
          </div>

          <div class="events-list">
            <div class="event-item" *ngFor="let ev of upcomingShipments">
              <div class="event-date-box mono">
                <span class="ev-day">{{ ev.day }}</span>
                <span class="ev-month">{{ ev.month }}</span>
              </div>
              <div class="event-info">
                <div class="event-title">{{ ev.title }}</div>
                <div class="event-time mono">{{ ev.time }}</div>
              </div>
              <div class="event-dot" [style.background-color]="ev.color"></div>
            </div>
          </div>
        </div>

        <!-- 10. SYSTEM STATUS / STORAGE BARS CARD -->
        <div class="bento-card card-status">
          <div class="card-header-line">
            <div class="card-title">Facility Storage Status</div>
          </div>

          <div class="status-top-circle">
            <div class="status-ring-container">
              <svg viewBox="0 0 100 100" class="status-svg">
                <circle cx="50" cy="50" r="40" class="ring-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  class="ring-progress ring-blue-grad"
                  stroke-dasharray="251.2"
                  [attr.stroke-dashoffset]="251.2 - (251.2 * overallCapacityPercent()) / 100"
                />
              </svg>
              <div class="status-ring-text">
                <span class="status-pct mono">{{ overallCapacityPercent() }}%</span>
                <span class="status-sub">Occupancy</span>
              </div>
            </div>
          </div>

          <!-- Horizontal Storage Bars -->
          <div class="storage-bars-list">
            <div class="storage-row" *ngFor="let wh of computedWarehouses()">
              <span class="storage-name">{{ wh.name }}</span>
              <div class="storage-track">
                <div class="storage-fill" [style.width.%]="wh.fillPercentage || 0"></div>
              </div>
              <span class="storage-val mono">{{ wh.fillPercentage || 0 }}%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .bento-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Reference Image 2: Exact 2-Column Responsive Bento Layout */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.35rem;
    }

    @media (max-width: 900px) {
      .bento-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Common Bento Card Styling */
    .bento-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-card);
      padding: 1.4rem 1.6rem;
      box-shadow: var(--shadow-card);
      backdrop-filter: blur(14px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      transition: all var(--transition-base);
    }
    .bento-card:hover {
      border-color: var(--border-strong);
      transform: translateY(-2px);
    }

    .card-header-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .card-title {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .card-dropdown {
      font-size: 0.75rem;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .card-link {
      font-size: 0.75rem;
      color: var(--accent-cyan);
      font-weight: 600;
    }

    /* ========================================================
       Card 1: Greeting & Sparkline
       ======================================================== */
    .card-greeting {
      min-height: 185px;
    }
    .greeting-kicker {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .time-pill {
      background: rgba(11, 43, 38, 0.75);
      border: 1px solid var(--border-subtle);
      padding: 0.2rem 0.65rem;
      border-radius: var(--radius-pill);
      font-size: 0.75rem;
      color: var(--text-primary);
    }
    .greeting-name {
      font-size: 2rem;
      font-weight: 700;
      color: var(--c-pale-mint);
      letter-spacing: -0.02em;
      line-height: 1.1;
      margin-top: 0.25rem;
    }
    .greeting-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .wave-container {
      width: 100%;
      height: 70px;
      margin-top: 0.5rem;
    }
    .neon-wave-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* ========================================================
       Card 2: Climate / Weather
       ======================================================== */
    .card-climate {
      min-height: 185px;
    }
    .climate-date {
      font-size: 1rem;
      font-weight: 600;
      color: var(--c-pale-mint);
    }
    .climate-day {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .climate-weather-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
    .weather-icon-box {
      font-size: 2.2rem;
      color: var(--accent-orange);
    }
    .weather-temp {
      font-size: 2.3rem;
      font-weight: 700;
      color: var(--c-pale-mint);
      line-height: 1;
    }
    .temp-unit {
      font-size: 1.4rem;
      font-weight: 400;
      vertical-align: top;
    }
    .climate-condition {
      font-size: 0.8rem;
      color: var(--c-mint-sage);
      margin-top: 0.35rem;
    }
    .climate-range {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* ========================================================
       Card 3: Productivity / Fulfillment Ring
       ======================================================== */
    .prod-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.5rem;
    }
    .prod-large-percent {
      font-size: 2.4rem;
      font-weight: 700;
      color: var(--c-pale-mint);
      line-height: 1;
    }
    .prod-label {
      font-size: 0.78rem;
      color: var(--c-mint-sage);
      margin-top: 0.25rem;
    }
    .prod-metrics-duo {
      display: flex;
      gap: 1.25rem;
      margin-top: 1rem;
    }
    .metric-caption {
      font-size: 0.68rem;
      color: var(--text-muted);
    }
    .metric-num {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--c-pale-mint);
    }
    .prod-ring-box {
      width: 100px;
      height: 100px;
      position: relative;
    }
    .ring-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .ring-bg {
      fill: none;
      stroke: rgba(142, 182, 155, 0.12);
      stroke-width: 9;
    }
    .ring-progress {
      fill: none;
      stroke-width: 9;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s ease;
    }
    .ring-blue-grad {
      stroke: #38bdf8;
      filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.5));
    }

    /* ========================================================
       Card 4: Focus Timer / Reorder Cycle
       ======================================================== */
    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--accent-orange);
      box-shadow: 0 0 8px var(--accent-orange);
    }
    .timer-ring-wrapper {
      position: relative;
      width: 130px;
      height: 130px;
      margin: 0.5rem auto 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .timer-svg {
      position: absolute;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .timer-ring-bg {
      fill: none;
      stroke: rgba(251, 146, 60, 0.15);
      stroke-width: 9;
    }
    .timer-ring-val {
      fill: none;
      stroke-width: 9;
      stroke-linecap: round;
      filter: drop-shadow(0 0 8px rgba(251, 146, 60, 0.5));
      transition: stroke-dashoffset 0.4s ease;
    }
    .timer-digits {
      position: relative;
      text-align: center;
    }
    .digits-val {
      font-size: 1.55rem;
      font-weight: 700;
      color: var(--c-pale-mint);
    }
    .digits-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    /* ========================================================
       Card 5: Operations Priority Checklist
       ======================================================== */
    .icon-add-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.1rem;
      cursor: pointer;
    }
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }
    .task-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.84rem;
    }
    .task-checkbox {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .task-checkbox.checked {
      background: #38bdf8;
      color: #051F20;
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
    }
    .task-checkbox.in-progress {
      border: 2px solid var(--accent-orange);
    }
    .in-progress-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-orange);
    }
    .task-checkbox.pending {
      border: 2px solid var(--text-muted);
    }
    .task-name {
      flex: 1;
      color: var(--text-primary);
      font-size: 0.82rem;
    }
    .task-tag {
      font-size: 0.7rem;
      font-weight: 600;
    }
    .tag-completed {
      color: var(--text-muted);
    }
    .tag-progress {
      color: var(--accent-orange);
    }
    .tag-pending {
      color: var(--text-muted);
    }

    /* ========================================================
       Card 6: System Pulse
       ======================================================== */
    .pulse-status-line {
      font-size: 0.95rem;
      font-weight: 600;
      color: #38bdf8;
    }
    .pulse-wave-box {
      width: 100%;
      height: 75px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0.5rem 0;
    }
    .pulse-sine-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .pulse-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }
    .pulse-footer-label {
      color: var(--text-muted);
    }
    .pulse-footer-val {
      font-weight: 600;
    }

    /* ========================================================
       Card 7: Weekly Activity Bar Chart
       ======================================================== */
    .bar-chart-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 130px;
      padding-top: 1.5rem;
    }
    .bar-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      flex: 1;
      height: 100%;
      justify-content: flex-end;
    }
    .bar-pill-track {
      position: relative;
      width: 8px;
      height: 85px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .bar-pill-fill {
      width: 100%;
      background: #38bdf8;
      opacity: 0.65;
      border-radius: var(--radius-pill);
      transition: height 0.5s ease;
    }
    .bar-pill-fill.bar-active {
      background: #00d2ff;
      opacity: 1;
      box-shadow: 0 0 12px rgba(0, 210, 255, 0.65);
    }
    .active-bar-badge {
      position: absolute;
      top: -26px;
      background: #0E312B;
      border: 1px solid var(--border-strong);
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-xs);
      font-size: 0.65rem;
      color: var(--c-pale-mint);
      white-space: nowrap;
    }
    .bar-day {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .day-active {
      color: var(--c-pale-mint);
      font-weight: 600;
    }

    /* ========================================================
       Card 8: Shortcuts Grid
       ======================================================== */
    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.8rem;
      margin-top: 0.25rem;
    }
    .shortcut-box {
      background: rgba(11, 43, 38, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.85rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      text-decoration: none;
      transition: all var(--transition-fast);
    }
    .shortcut-box:hover {
      background: rgba(22, 56, 50, 0.9);
      border-color: var(--border-strong);
      transform: translateY(-2px);
    }
    .sc-icon {
      font-size: 1.35rem;
      color: var(--c-mint-sage);
    }
    .shortcut-box:hover .sc-icon {
      color: var(--c-pale-mint);
    }
    .sc-label {
      font-size: 0.72rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* ========================================================
       Card 9: Upcoming Shipments
       ======================================================== */
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .event-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .event-date-box {
      background: rgba(11, 43, 38, 0.8);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.35rem 0.55rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;
      width: 44px;
    }
    .ev-day {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--c-pale-mint);
    }
    .ev-month {
      font-size: 0.6rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .event-info {
      flex: 1;
    }
    .event-title {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .event-time {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .event-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ========================================================
       Card 10: Facility Status & Storage Bars
       ======================================================== */
    .status-top-circle {
      display: flex;
      justify-content: center;
      margin: 0.25rem 0 0.75rem;
    }
    .status-ring-container {
      position: relative;
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .status-svg {
      position: absolute;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .status-ring-text {
      position: relative;
      text-align: center;
    }
    .status-pct {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--c-pale-mint);
    }
    .status-sub {
      font-size: 0.65rem;
      color: var(--text-muted);
      display: block;
    }
    .storage-bars-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-top: 0.5rem;
    }
    .storage-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.76rem;
    }
    .storage-name {
      width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-secondary);
    }
    .storage-track {
      flex: 1;
      height: 6px;
      background: rgba(142, 182, 155, 0.12);
      border-radius: var(--radius-pill);
      overflow: hidden;
    }
    .storage-fill {
      height: 100%;
      background: #38bdf8;
      border-radius: var(--radius-pill);
      box-shadow: 0 0 6px rgba(56, 189, 248, 0.4);
    }
    .storage-val {
      font-size: 0.72rem;
      color: var(--text-primary);
      width: 32px;
      text-align: right;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private api = inject(InventoryApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal<boolean>(false);
  products = signal<Product[]>([]);
  warehouses = signal<Warehouse[]>([]);
  inventory = signal<Inventory[]>([]);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  customerOrders = signal<CustomerOrder[]>([]);
  recentMovements = signal<StockMovement[]>([]);

  // Clock & Dates
  liveTime = signal<string>('');
  currentDateFormatted = signal<string>('');
  currentDayName = signal<string>('');
  private clockTimer: any;

  // Focus Countdown Timer
  timerSeconds = 1500; // 25:00
  isTimerRunning = false;
  private intervalTimer: any;

  // Weekly Bars (Reference Image 2)
  weeklyBars = [
    { day: 'Mon', height: 45, val: 85, active: false },
    { day: 'Tue', height: 35, val: 62, active: false },
    { day: 'Wed', height: 42, val: 78, active: false },
    { day: 'Thu', height: 50, val: 94, active: false },
    { day: 'Fri', height: 68, val: 124, active: false },
    { day: 'Sat', height: 85, val: 148, active: true },
    { day: 'Sun', height: 55, val: 102, active: false }
  ];

  // Upcoming Shipments (Reference Image 2)
  upcomingShipments = [
    { day: '25', month: 'OCT', title: 'Continental Tech Dispatch', time: '10:00 AM – PO-102', color: '#38bdf8' },
    { day: '26', month: 'OCT', title: 'Apex Global Logistics Inbound', time: '02:00 PM – PO-103', color: '#fb923c' },
    { day: '28', month: 'OCT', title: 'East Hub Restock Freight', time: '11:00 AM – PO-104', color: '#8EB69B' }
  ];

  // Computed Metrics
  totalCustomerOrders = computed(() => this.customerOrders().length || 18);
  completedOrderCount = computed(() => {
    return this.customerOrders().filter(o => o.status === 'DELIVERED').length || 14;
  });

  fulfillmentRate = computed(() => {
    const total = this.totalCustomerOrders();
    if (total === 0) return 78;
    return Math.round((this.completedOrderCount() / total) * 100) || 78;
  });

  lowStockProducts = computed(() => {
    const inv = this.inventory();
    const prodMap = new Map<number, number>();
    for (const item of inv) {
      const pId = item.product?.id || item.productId;
      if (pId) {
        prodMap.set(pId, (prodMap.get(pId) || 0) + (item.quantity || 0));
      }
    }

    return this.products()
      .map(p => ({ ...p, totalStock: prodMap.get(p.id) || 0 }))
      .filter(p => (p.totalStock ?? 0) <= (p.reorderLevel ?? 0));
  });

  computedWarehouses = computed(() => {
    const inv = this.inventory();
    return this.warehouses().map(wh => {
      const occupied = inv
        .filter(i => (i.warehouse?.id === wh.id) || (i.warehouseId === wh.id))
        .reduce((sum, item) => sum + (item.quantity || 0), 0);
      const cap = wh.capacity > 0 ? wh.capacity : 1000;
      const fillPercentage = Math.min(100, Math.round((occupied / cap) * 100));
      return {
        ...wh,
        currentOccupancy: occupied,
        fillPercentage
      };
    });
  });

  overallCapacityPercent = computed(() => {
    const whs = this.computedWarehouses();
    if (whs.length === 0) return 92;
    const totalCap = whs.reduce((sum, w) => sum + w.capacity, 0);
    const totalOcc = whs.reduce((sum, w) => sum + (w.currentOccupancy || 0), 0);
    return Math.min(100, Math.round((totalOcc / (totalCap || 1)) * 100)) || 92;
  });

  ngOnInit() {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadAllData();
  }

  ngOnDestroy() {
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  updateClock() {
    const now = new Date();
    this.liveTime.set(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    this.currentDateFormatted.set(
      now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    );
    this.currentDayName.set(
      now.toLocaleDateString([], { weekday: 'long' })
    );
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  formatTimer(): string {
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  toggleTimer() {
    this.isTimerRunning = !this.isTimerRunning;
    if (this.isTimerRunning) {
      this.intervalTimer = setInterval(() => {
        if (this.timerSeconds > 0) {
          this.timerSeconds--;
        } else {
          this.isTimerRunning = false;
          clearInterval(this.intervalTimer);
          this.toast.info('Reorder sweep cycle complete!');
        }
      }, 1000);
    } else {
      if (this.intervalTimer) clearInterval(this.intervalTimer);
    }
  }

  loadAllData() {
    this.loading.set(true);
    forkJoin({
      products: this.api.getProducts(),
      warehouses: this.api.getWarehouses(),
      inventory: this.api.getInventory(),
      pos: this.api.getPurchaseOrders(),
      orders: this.api.getCustomerOrders(),
      movements: this.api.getStockMovements()
    }).subscribe({
      next: (res) => {
        this.products.set(res.products || []);
        this.warehouses.set(res.warehouses || []);
        this.inventory.set(res.inventory || []);
        this.purchaseOrders.set(res.pos || []);
        this.customerOrders.set(res.orders || []);
        this.recentMovements.set(res.movements || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
