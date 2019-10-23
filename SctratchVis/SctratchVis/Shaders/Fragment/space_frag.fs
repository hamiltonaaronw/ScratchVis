#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uDeltaTime;

uniform vec2 uRes;

uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	float ret = sin(x) / x;
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
	return ret;
}

vec2 eq(vec2 p, float t)
{
	float f = abs(min(uFreq, uLastFreq)) + abs(uDeltaFreq / 2.0);

	vec2 fx = vec2(uFreq);
	fx.x = (sin(p.y + cos(t + p.x * 0.2)) * cos(p.x - t));
	fx.x *= acos(fx.x * f);
	fx.x *= -distance(fx.x * (f * 10.0), 0.5) * p.x / p.y;

	fx.y = p.y - fx.x;

	vec2 ret = fx;

	return ret;
}

//********************************
#define PHANTOM_MODE

vec3 trans(vec3 p, float i)
{
	vec3 ret = mod(p, i) - i / 2.0;
	return ret;
}

mat2 rot(float a)
{
	float c = cos(a);
	float s = sin(a);
	mat2 ret = mat2(
		c, s,
		-s, c
	);
	return ret;
}

vec2 pmod(vec2 p, float r)
{
	float a = atan(p.x, p.y) + PI / r;
	float n = PI * 2.0 / r;
	a = floor(a / n) * n;

	vec2 ret = p * rot(-a);
	return ret;
}

// linear interpolation for scalars
float lerp(float a, float b, float i)
{
	if (i < 0.0)
		i += 1.0;
	float ret = a * (1.0 - i) + b * i;
	return ret;
}

// linear interpolation for vectors
vec3 lerp(vec3 a, vec3 b, float i)
{
	if (i < 0.0)
		i += 1.0;
	vec3 ret = a * (1.0 - i) + b * i;
	return ret;
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec3 rotate(vec3 p, float an, vec3 ax)
{
	vec3 a = normalize(ax);
	float s = sin(an);
	float c = cos(an);
	float r = 1.0 - c;

    mat3 m = mat3(
        a.x * a.x * r + c,
        a.y * a.x * r + a.z * s,
        a.z * a.x * r - a.y * s,
        a.x * a.y * r - a.z * s,
        a.y * a.y * r + c,
        a.z * a.y * r + a.x * s,
        a.x * a.z * r + a.y * s,
        a.y * a.z * r - a.x * s,
        a.z * a.z * r + c
    );

	vec3 ret = m * p;
	return ret;
}

float rand(vec2 st)
{
	float ret = fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5432123);
	return ret;
}

float sdPlane(vec3 p)
{
	return p.y;
}

float sdRoad(vec3 p)
{
	float d = p.y;
	d = max(d, abs(sin(p.z * 0.3) * 0.8 + p.x) - 0.4);
	
	float ret = d;
	return ret;
}

float sdSphere(vec3 p, float r)
{
	float f = abs(min(uFreq, uLastFreq)) + abs(uDeltaFreq / 2.0);

	float d = length(p) - (r * sin(mod(uTime, f))) - r;
	float ret = d * cos(f);
	return ret;
}

float sdSphereMod(vec3 p, float r)
{
	p = trans(sin(p), 2.0);
	return sdSphere(p, r);
}

float sdBox(vec3 p, vec3 b)
{
	float f = abs(min(uFreq, uLastFreq)) + abs(uDeltaFreq / 2.0);
	vec3 d = abs(p) - b;
	float ret = length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
	ret += tan(sin(f) * sin(uTime));

	return ret;
}

float sdBoxMod(vec3 p, vec3 b)
{
	p = trans(p, 6.0);
	return sdBox(p, b);
}

float sdTorus(vec3 p, vec2 t)
{
	float f = abs(min(uFreq, uLastFreq)) + abs(uDeltaFreq / 2.0);
	vec2 q = vec2(length(p.xz) - t.x, p.y);
	float ret;

	ret = length(q) - t.y;
	return ret;
}

float sdTorusMod(vec3 p, vec2 t)
{
	p.y = mod(p.y, 10.0) - 5.0;
	return sdTorus(p, t);
}

float sdHexPrism(vec3 p, vec2 h)
{
	vec3 k = vec3(-0.8660254, 0.5, 0.57735);
	float f = abs(min(uFreq, uLastFreq)) + abs(uDeltaFreq / 2.0);
	p = abs(p);
	p.xy -= 2.0 * min(dot(k.xy, p.xy), 0.0) * k.xy;
	vec2 d = vec2(
		length(p.xy - vec2(clamp(p.x, -k.z * h.x, k.z * h.x), h.x)) * sign(p.y - h.x),
		p.z - h.y
	);

	float ret = min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
	ret += sin(cos(f) * sin(uTime) / uFreq) * mod(sin(uTime), cos(uTime));
	return ret;
}

float sdHexPrismMod(vec3 p, vec2 h)
{
	p.z = abs(mod(p.x, 8.0) - 4.0);
	return sdHexPrism(p, h);
}

float sdCappedCylinder(vec3 p, vec2 h)
{
	vec2 d = abs(vec2(length(p.xz), p.y)) - h;
	float ret = min(max(d.x, d.y), 0.0) + length(max(d, 0.0));

	return ret;
}

// pixel effect
vec2 pixelate(vec2 p, float pRes)
{
	p = floor(p * min(uRes.x, uRes.y) / pRes) * pRes / min(uRes.x, uRes.y);

	vec2 ret = p;
	return ret;
}

float map(vec3 p)
{
	float f = abs(min(uFreq, uLastFreq)) + abs(uDeltaFreq / 2.0);
	float speed = 16.0;
	float dist = 1.0;
	dist = min(dist, sdBoxMod(p - vec3(0.0), vec3(2.0, 2.0, 1.0)));

	dist = min(dist, sdSphereMod(p - vec3(1.0, 1.0, 0.0), 0.08));
	dist = max(dist, -sdHexPrismMod(p - vec3(0.0), vec2(4.0, 10.0)));
	dist = min(dist, sdHexPrismMod(p - vec3(0.0), vec2(2.5, 1.0)));
	dist = max(dist, -sdHexPrismMod(p - vec3(0.0), vec2(2.3, 10.0)));

	dist = min(dist, sdSphere(p, 0.4));
	dist = min(dist, sdTorus(
		rotate(p, PI / 4.0 * uTime, vec3(sin(uTime), 0.0, 1.0)),
		vec2(1.2, 0.1)));

	for (int i = 0; i < 2; i++)
	{
		p = abs(p);
		p.xz *= rot(uTime - 1.0);
		p.xy *= rot(uTime * 0.87);
	}

	float ret = dist / cos(f);

	return ret;// * (f / uFreq);
}

vec3 col(vec2 p)
{
	float f = abs(min(uFreq, uLastFreq)) + abs(uDeltaFreq / 2.0);
	vec3 cPos = vec3(0.0, 0.0, -10.0);
	float sZ = 2.0;
	vec3 rayDir = normalize(vec3(p, sZ));

	vec3 bg = vec3(0.0);
	vec3 near = vec3(0.3, 1.0, 0.9);

	float depth = 0.0;
	vec3 c = bg;

	for (int i = 0; i < 99; i++)
	{
		//i *= int(floor(f * 10.0));
		vec3 rayPos = cPos + rayDir * depth;
		float dist = map(rayPos);
		float dAmount = clamp(depth / 500.0, 0.0, 1.0);

#ifdef PHANTOM_MODE // transparent
		dist = max(abs(dist), 0.001 * sin(uFreq * uTime) * cos(f));
		//dist *= f;
		c += hsv(-dAmount + f, uFreq + (f - dAmount) * 0.2, mod(depth - uTime * 0.5, 5.0) / 4.0) / 99.0;
#else // opaque
		if (dist < 0.001)
		{
			c = lerp(near, bg, clamp(depth / 50.0, 0.0, 1.0));
			break;
		}
#endif
		depth += dist;
		depth -= uSpectrum[int(mod(dist, 256))];
	}

	c += vec3(sdSphere(vec3(p, 0.0), 0.0) * 0.3, 0.0, 0.25);

	float cRes = 4.0;
	vec3 stepCol = floor(c * cRes) / cRes;
	c = lerp(c, stepCol * f, smoothstep(-0.5, -1.0, sin(uTime / 2.0) * f));

	c = pow(c, vec3(2.0));

	vec3 ret = c;
	ret -= vec3(pixelate((oTexCoord + p * sin(f * PI)) * rot(uTime * 0.1), cos(f) * sin(uTime)), sin(uFreq) + 0.5) * uFreq;

	return ret * (uTime * 0.001 + f / f);
}

void main()
{
	vec2 uv = ((gl_FragCoord.xy / uRes.xy) / 2.0 - 0.5);

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}