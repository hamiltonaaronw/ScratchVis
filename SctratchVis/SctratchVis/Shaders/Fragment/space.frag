#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

float scale;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec2 pmod(vec2 p, float n)
{
	float a = atan(p.x, p.y) + PI / n;
	float num = 2.0 * PI / n;
	a = floor(a / num) * num;
	return rot(-a) * p;
}

float co(vec3 p, vec3 s)
{
	return length(max(abs(p) - s, 0.0));
}

vec3 trs(vec3 p)
{
	vec3 pos = p;
	pos.z -= uTime * 3.0;
	float k = 8.0;
	pos = mod(pos, k) - k * 0.5;

	pos.xy = pmod(pos.xy, 6.0);
	pos.yz = pmod(pos.yz, 5.0);
	pos.xz = pmod(pos.xz, 12.0);

	pos = abs(pos) - 0.15;
	pos.z = abs(pos.z) - 0.12;
	pos.z = abs(pos.z) - 0.182;

	return pos;
}

float m1m(vec3 p)
{
	p = trs(p);

	p = abs(p);
	vec3 o = p * 1.5;
	float s = 1.0;

	for (int i = 0; i < 5; i++)
	{
		if (p.x < p.y)
			p.xy = p.zx;
		if (p.x < p.z)
			p.xz = p.zx;
		if (p.y < p.z)
			p.yz = p.zy;

		p.xy = pmod(p.xy, 3.0 * 0.25);
		p.yz = pmod(p.yz, 6.0 * 0.8);
		p.xz = pmod(p.xz, 4.0 * 0.85);

		float r = 0.55 * clamp(5.38 * max(dot(p, p) * 3.2, 5.01), 0.1, 0.98) * 9.0;

		s *= r;
		p *= r;
		p = abs(p) - o;

		p = abs(p) - 0.5;
		p.z = abs(p.z) - 0.92;
		p.x = abs(p.x) - 0.45;
		p.z -= 0.2;
		p = abs(p) - 0.5;
		p.xz = pmod(p.xz, 12.0);
		p.xy = pmod(p.xy, 6.0);
		p = abs(p) - 0.15;
		p.y = abs(p.y) - 0.6;

		p.xy *= rot(0.23);
		p.yz *= rot(0.74);
		p.xz *- rot(0.623);

		p.z -= 0.4;
		p.z = abs(p.z) - 0.5;

		p = abs(p) - 0.25;

		if (p.x < p.y)
			p.xy = p.yx;
		if (p.x < p.z)
			p.xz = p.zx;
		if (p.y < p.z)
			p.yz = p.zy;
	}

	p /= s;

	p.xz = pmod(p.xz, 12.0);
	p.z = abs(p.z) - 0.45;
	p.z = abs(p.z) - 0.12;
	p.xy = pmod(p.xy, 2.0);
	p.z = abs(p.z) - 0.231;
	p.xy = pmod(p.xy, 3.0);

	float m = co(p, vec3(1.0, 1.0, 0.3));
	return m;
}

float map(vec3 p)
{
	return m1m(p);
}

vec3 gn(vec3 p)
{
	vec2 e = vec2(0.001, 0.0);

	return normalize(
		vec3(
			map(p + e.xyy) - map(p - e.xyy),
			map(p + e.yxy) - map(p - e.yxy),
			map(p + e.yyx) - map(p - e.yyx)
		));
}

float lerp(float a, float b, float t)
{
	return (1.0 - t) * a + b * t;
}

float invLerp(float a, float b, float v)
{
	return (v - a) / (b - a);
}

float remap(float iMin, float iMax, float oMin, float oMax, float v)
{
	float t = invLerp(iMin, iMax, v);
	return lerp(oMin, oMax, t);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	
	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float tm = mod(uTime, PI / 10.0);
	float ff = smoothstep(min(f, tm), max(uFreq, tm) * uFreq, cosc(TAU) + uLastFreq);
	float tf = atan(tm, ff);
	float fsum = (uFreq - uLastFreq) + f + tm + ff + tf;
	vec3 vf = vec3(
		uSpectrum[32] / f,
		uSpectrum[64] - f,
		uSpectrum[128] * f
	) + sin(uFreq);
	fsum /= length(vf);
	float fl = remap(f, tm, ff, tf, fsum);

	vec2 st = p;
	st *= rot(uTime * 0.1);
	float phi = uTime * 0.2;

	vec3 ro = vec3(0.0, 0.0, 1.0);
	vec3 ta = vec3(0.0);

	vec3 cDir = normalize(ta - ro);
//vec3 side = cross(cDir, vec3(0.0, 1.0, 0.0));
	vec3 side = cross(cDir, vec3(0.0, 1.0 - abs(fsum - fl), 0.0));
	vec3 up = cross(cDir, side);
//float fov = 0.6;
	float fov = fsum / 0.9;

	vec3 rd  = normalize(vec3(st.x * side + st.y * up + cDir * fov));

	float d;
	float t = 0.0;
	float acc = 0.0;

	for (int i = 0; i < 24; i++)
	{
		d = map(ro + rd * t);
//d = min(abs(d), 0.2);
		d = min(abs(d), fsum * fl);
		if (abs(d) < 0.001 || t > 1000.0)
			break;
t += d;
		//t += (d + length(normalize(cross(rd, vf))));
//acc += exp(-6.0 * d);
		acc += exp(-6.0 * d / fl) * fsum / fl;
	}

	float r = fl;
	float g = length(p);// 0.8;
	float b = mod(fov + uFreq, length(vf));
	c = vec3(r, g, b) * acc * 0.025;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}


void main()
{
	vec2 uv;
	//uv = gl_FragCoord.xy / uRes.xy / 2.0;
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) / 2.0;

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}