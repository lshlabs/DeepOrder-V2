import { Minus, Phone, Store, TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "../../../../../components/ui/card";
import { platformData } from "../data/mock-data";

const BaeminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 592 593" className="h-6 w-6 rounded-md">
    <rect width="592" height="593" fill="#0cefd3" rx="100" ry="100" />
    <path d="M127 1h32v153h-32zm0 275h32v178h-32zM287 0h33v593h-33zm155 2h32v208h-32zm0 336h32v253h-32z" />
  </svg>
);

const YogiyoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="0 0 371.583 371.584"
    className="h-6 w-6 rounded-md"
  >
    <defs>
      <clipPath id="yogiyo-icon-clip" clipPathUnits="userSpaceOnUse">
        <path d="M0 841.89h595.28V0H0Z" />
      </clipPath>
    </defs>
    <g
      clipPath="url(#yogiyo-icon-clip)"
      transform="matrix(1.33333 0 0 -1.33333 -211.197 748.057)"
    >
      <path
        fill="#e61c4f"
        d="M437.085 304.67c0-12.325-9.993-22.316-22.316-22.316H180.716c-12.327 0-22.318 9.991-22.318 22.316v234.057c0 12.323 9.991 22.315 22.318 22.315h234.053c12.323 0 22.316-9.992 22.316-22.315Z"
      />
      <path
        fill="#fff"
        d="M245.226 401.86v7.303l-10.877-1.473v-7.19a86 86 0 0 0-5.362-.184c-1.803 0-3.586.073-5.358.184v7.19l-10.883 1.473v-7.303a87 87 0 0 0-11.185 2.889l-3.334-10.055a97.5 97.5 0 0 1 30.76-4.969c10.75 0 21.082 1.76 30.76 4.969l-3.336 10.055a87 87 0 0 0-11.185-2.889M228.989 442.957c5.957 0 10.782-4.83 10.782-10.784s-4.825-10.785-10.782-10.785c-5.958 0-10.786 4.83-10.786 10.785 0 5.954 4.828 10.784 10.786 10.784m0-32.283c11.872 0 21.5 9.627 21.5 21.499 0 11.874-9.628 21.498-21.5 21.498-11.877 0-21.503-9.624-21.503-21.498 0-11.872 9.626-21.499 21.503-21.499M312.556 391.08l11.2-.009v61.966l-11.2.009ZM270.195 449.79v-10.727h20.559v-1.752c0-3.094.427-8.209-2.684-12.67-3.318-4.764-11.838-10.701-19.207-14.679l4.828-9.435c8.522 4.448 21.246 13.151 24.633 19.451 3.401 6.316 3.806 10.627 3.806 22.8l-.029 6.999zM393.923 404.749a87 87 0 0 0-11.187-2.889v7.303l-10.88-1.473v-7.19a87 87 0 0 0-5.361-.184c-1.8 0-3.584.074-5.359.184v7.19l-10.88 1.473v-7.303a87 87 0 0 0-11.183 2.889l-3.338-10.055a97.5 97.5 0 0 1 30.76-4.968 97.5 97.5 0 0 1 30.762 4.968zM366.497 442.957c5.957 0 10.784-4.83 10.784-10.784s-4.827-10.785-10.784-10.785c-5.956 0-10.784 4.83-10.784 10.785 0 5.954 4.828 10.784 10.784 10.784m0-32.283c11.875 0 21.498 9.627 21.498 21.499 0 11.874-9.623 21.498-21.498 21.498-11.873 0-21.503-9.624-21.503-21.498 0-11.872 9.63-21.499 21.503-21.499"
      />
    </g>
  </svg>
);

const CoupangEatsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="0 0 801.114 813.02"
    className="h-6 w-6 rounded-md"
  >
    <defs>
      <clipPath id="coupang-eats-icon-clip" clipPathUnits="userSpaceOnUse">
        <path d="M0 841.89h595.276V0H0Z" />
      </clipPath>
    </defs>
    <g
      clipPath="url(#coupang-eats-icon-clip)"
      transform="matrix(1.7449 0 0 -1.7449 -119.421 1141.79)"
    >
      <path
        fill="#f9f9f9"
        d="M177.867 654.077h240.267c60.028 0 109.142-49.114 109.142-109.144V297.846c0-60.03-49.114-109.144-109.142-109.144H177.867c-60.029 0-109.143 49.114-109.143 109.144v247.087c0 60.03 49.114 109.144 109.143 109.144Z"
      />
      <path
        fill="#8b4a22"
        fillRule="evenodd"
        d="m157.197 361.98 50.692.238c13.001.062 10.932 1.427 11.293 15.18-.329 22.257-11.931 38.667-34.735 41.468-14.916 1.833-30.707-3.096-37.81-11.244-10.301-11.82-9.851-21.921-10.282-41.233-.617-27.661 4.573-50.844 38.46-52.347 17.33-.769 36.119 6.831 39.701 21.047l-17.648 8.454c-8.061-10.692-19.609-16.252-32.319-7.557-7.594 5.194-7.964 14.48-7.352 25.994m128.211-9.227.048-2.993c-.635-10.136-9.272-18.167-19.837-18.167-10.976 0-19.874 8.669-19.874 19.364s8.898 19.364 19.874 19.364c10.355 0 18.859-7.716 19.789-17.568m-53.948 58.819 5.524-16.972c4.091.721 47.963 22.255 48.007-15.368l.015-.897c-6.387 5.143-14.579 8.234-23.512 8.234-20.393 0-36.927-16.109-36.927-35.977 0-19.87 16.534-35.977 36.927-35.977 9.341 0 17.871 3.381 24.374 8.953l.032-1.975-.171-5.59 18.366.244c1.04 14.294.211 31.528.212 46.142.002 23.473 1.334 39.411-18.035 51.403-20.398 12.626-40.544 1.449-54.812-2.22m93.026 29.976 20.464 5.116v-29.417h26.346v-17.651H344.95v-52.438c0-10.358 4.555-16.372 28.704-11.897l2.485-16.247c-18.734-8.941-51.653-6.131-51.653 19.447v61.135h-14.837v17.651h14.837zm98.482-21.488c12.685-.089 28.223-8.1 35.044-14.836l-10.487-15.348c-10.668 5.868-26.14 17.691-38.115 6.651-3.531-3.255-4.881-9.615 1.536-14.324 6.47-4.75 19.462-7.565 30.407-13.11 10.308-5.222 18.801-12.868 18.317-26.834-.666-19.281-19.938-28.177-36.959-28.336-16.839-.156-33.495 8.185-41.95 23.515l17.139 9.208c7.053-9.653 14.302-16.109 27.626-15.348 5.624.322 12.623 5.126 13.045 10.745.996 13.227-26.946 17.358-35.299 21.23-8.46 3.921-19.329 16.16-18.674 27.115 1.122 18.755 18.513 29.812 38.37 29.672m-265.697-42.182c-3.571 30.648 44.256 31.342 40.172-.194Z"
      />
      <path
        fill="#5e2f27"
        fillRule="evenodd"
        d="m173.758 518.775-6.417-5.45s-2.574 6.369-9.679 6.369-11.322-2.686-11.322-10.64v-11.098c0-2.985 1.228-10.865 9.276-10.865s11.595 6.275 11.595 6.275l6.82-5.184s-5.35-9.821-18.143-9.821c-12.79 0-19.37 9.248-19.37 18.476 0 8.078.274 6.573.274 14.432 0 7.86 6.26 15.679 16.505 16.746 10.245 1.068 17.707-3.869 20.461-9.24M225.733 527.197h9.686s-.137-21.936-.137-27.419c0-5.485 2.138-12.961 9.549-12.961 7.412 0 10.367 3.403 10.367 12.687v27.421h9.686V478.63h-8.322v4.372s-5.724-4.912-14.187-4.912c-8.461 0-16.642 7.356-16.642 17.459s-.136 31.648 0 31.648"
      />
      <path
        fill="#c7ce23"
        fillRule="evenodd"
        d="M406.846 478.088h-9.686s.138 21.934.138 27.417-2.14 12.961-9.55 12.961c-7.412 0-10.368-5.114-10.368-13.885v-26.222h-9.685v48.296h8.323v-4.372s2.644 5.254 13.159 4.913c10.517-.343 17.669-7.36 17.669-17.462s.136-31.646 0-31.646"
      />
      <path
        fill="#5e2f27"
        fillRule="evenodd"
        d="M195.963 519.694h3.884c4.635 0 8.425-4.647 8.425-10.329v-11.947c0-5.678-3.79-10.327-8.425-10.327h-3.884c-4.635 0-8.425 4.649-8.425 10.327v11.947c0 5.682 3.79 10.329 8.425 10.329m-.687 8.457h4.985c9.208 0 16.742-7.561 16.742-16.802v-15.914c0-9.243-7.534-16.802-16.742-16.802h-4.985c-9.209 0-16.742 7.559-16.742 16.802v15.914c0 9.241 7.533 16.802 16.742 16.802"
      />
      <path
        fill="#e62830"
        fillRule="evenodd"
        d="M292.393 519.693h4.786c4.636 0 8.427-4.648 8.427-10.327v-11.948c0-5.677-3.791-10.328-8.427-10.328h-4.786c-4.634 0-8.426 4.648-8.426 10.328v11.948c0 5.679 3.791 10.327 8.426 10.327m-18.098 7.23v-67.662H284.8v22.513s2.167-3.412 11.731-3.412 17.463 8.178 17.463 16.641v16.232c0 4.776-4.079 15.837-14.871 16.371s-14.06-2.309-15.55-5.185v4.641z"
      />
      <path
        fill="#fbbd43"
        fillRule="evenodd"
        d="M338.137 504.236h1.234c4.496 0 8.173-3.677 8.173-8.172v-1.639c0-4.496-3.677-8.172-8.173-8.172h-1.234c-4.496 0-8.173 3.676-8.173 8.172v1.639c0 4.495 3.677 8.172 8.173 8.172m-14.594 19.413 3.956-6.549s4.23 3.27 11.868 2.588c7.639-.682 9.413-5.86 9.276-10.362 0 0-3.545 2.729-11.051 2.729-7.502 0-14.731-4.912-16.231-10.915s-1.365-20.05 10.639-22.37c12.005-2.319 17.598 4.23 17.598 4.23v-4.504h8.188v34.382c0 17.164-23.86 20.078-34.243 10.771"
      />
      <path
        fill="#61bfe7"
        fillRule="evenodd"
        d="M432.376 519.612h1.442c5.247 0 9.536-3.866 9.536-8.593v-1.727c0-4.727-4.289-8.594-9.536-8.594h-1.442c-5.246 0-9.535 3.867-9.535 8.594v1.727c0 4.727 4.289 8.593 9.535 8.593m13.035 4.19c1.947 1.847 5.334 5.329 12.343 2.986l.13-7.229s-4.699 1.64-7.956-1.534a17.5 17.5 0 0 0 1.711-7.585c0-9.297-7.19-16.902-15.978-16.902-5.603 0-7.448-.375-12.48-7.494-.783-1.505.616-.904.616-.904 3.088 1.804 13.262 2.52 19.834 1.231 6.482-1.146 13.043-6.962 13.274-14.908s-11.962-15.234-11.962-15.234l-4.167 6.963c4.013 4.013 9.337 6.716 4.244 12.285-5.093 5.571-17.594 2.539-23.461 1.229-5.865-1.312-7.164 5.07-6.637 9.887.529 4.82 5.192 8.288 7.016 9.589-4.457 3.007-7.428 8.282-7.428 14.258 0 9.296 7.187 16.899 15.976 16.899h5.175c3.665 0 7.048-1.323 9.75-3.537"
      />
    </g>
  </svg>
);

const renderPlatformBadge = (platformName: string, color: string) => {
  if (platformName === "배달의민족") {
    return <BaeminIcon />;
  }

  if (platformName === "요기요") {
    return <YogiyoIcon />;
  }

  if (platformName === "쿠팡이츠") {
    return <CoupangEatsIcon />;
  }

  if (platformName === "전화 주문") {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: color }}
      >
        <Phone className="h-3.5 w-3.5" />
      </div>
    );
  }

  if (platformName === "매장 주문") {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: color }}
      >
        <Store className="h-3.5 w-3.5" />
      </div>
    );
  }

  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      <Minus className="h-3.5 w-3.5" />
    </div>
  );
};

export function PlatformStats() {
  const totalOrders = platformData.reduce((sum, p) => sum + p.orders, 0);
  const totalRevenue = platformData.reduce((sum, p) => sum + p.revenue, 0);
  const maxOrders = Math.max(...platformData.map((p) => p.orders));

  return (
    <Card className="p-5 bg-card border-border/50">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div>
            <h3 className="text-base font-semibold">주문 유형</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              총 {totalOrders}건 · ₩{totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-0.5 h-4 rounded-full overflow-hidden">
          {platformData.map((p) => (
            <div key={p.name} className="h-full rounded-sm" style={{ width: `${Math.max((p.orders / totalOrders) * 120, 8)}px`, backgroundColor: p.color }} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {platformData.map((platform) => {
          const share = ((platform.orders / totalOrders) * 100).toFixed(1);
          const barWidth = (platform.orders / maxOrders) * 100;

          return (
            <div
              key={platform.name}
              className="group relative overflow-hidden rounded-xl border border-border/40 p-4 bg-gradient-to-b from-muted/30 to-transparent hover:border-border hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: platform.color }} />

              <div className="flex items-center justify-between mb-3">
                {renderPlatformBadge(platform.name, platform.color)}
                <div
                  className={`flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                    platform.change > 0 ? "bg-emerald-500/10 text-emerald-600" : platform.change < 0 ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {platform.change > 0 ? <TrendingUp className="h-3 w-3" /> : platform.change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {Math.abs(platform.change)}%
                </div>
              </div>

              <h4 className="text-sm font-semibold mb-1 truncate">{platform.name}</h4>

              <div className="space-y-0.5 mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold tracking-tight">{platform.orders}</span>
                  <span className="text-[10px] text-muted-foreground">건</span>
                </div>
                <p className="text-[11px] text-muted-foreground">₩{platform.revenue.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">점유율</span>
                  <span className="text-[10px] font-medium">{share}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${barWidth}%`, backgroundColor: platform.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
