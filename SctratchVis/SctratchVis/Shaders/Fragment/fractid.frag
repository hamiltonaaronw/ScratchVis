#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float[256] uSpectrum;
uniform vec2 uRes;

uniform float uTime;
#define uTiem uTime;
#define UtImE uTime;
#define uTIme uTime;

out vec4 retColor;

float sinc(float x) { return sin(x) / x;	}
float cosc(float x) { return cos(x) / x;	}

float lanczosKernel(int ai, float x)
{
	float ret;
	float af = float(ai);

	if (x == 0.0)
		return 1.0;
	if (-af <= x && x < af)
		return (af * sin(PI * x) * sin((PI * x) / af)) / ((PI * PI) * (x * x));
	else
		return 0;
}

float lanczosInterp(int ai, float x)
{
	float ret = 0.0;
	int ub = int(floor(x));
	int lb = int(floor(x)) - ai + 1;

	for (int i = lb; i <= ub; i++)
	{
		ret += uSpectrum[i] * lanczosKernel(ai, x - float(i));
		//ret = mod(abs(ret), 1.0);
	}

	return abs(ret);
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

float hash(vec2 p, float s)
{
	vec3 p2 = vec3(p.xy, 27.0 * abs(sin(s)));
	float ret = fract(sin(dot(p2, vec3(27.1, 61.7, 12.4))) * 2.1);
	return ret;
}

float noise(vec2 p, float s)
{
	vec2 i = floor(p);
	vec2 f = fract(p);

	f *= f * (3.0 - 2.0 * f);

	float ret = mix(mix(hash(i + vec2(0.0, 0.0), s), hash(i + vec2(1.0, 0.0), s), f.x),
					mix(hash(i + vec2(0.0, 1.0), s), hash(i + vec2(1.0, 1.0), s), f.x),
					f.y) * s;

	return ret;
}

float perlin(vec2 p, float f)
{
	mat2 m = mat2(2.0);
	float v = 0.0;
	float s = 1.0;

	for (int i = 0; i < 7; i++, s /= 2.0)
	{
		v += s * noise(p, f);
		p *= m;
	}

	return v;
} 

float circ(vec2 p)
{
	float r = length(p);
	r = log(sqrt(r));

	float ret = abs(mod(r * 4.0, TAU) - PI) * 3.0 + 0.2;

	return ret;
}

vec2 pmod(vec2 p, float n)
{
	float np = TAU / n;
	float r = atan(p.y, p.x) - 0.5 * np;
	r = mod(r, np) - 0.5 * np;
	vec2 ret;
	ret = length(p) * vec2(cos(r), sin(r));
	return ret;
}

float cube(vec3 p, vec3 s)
{
	vec3 q = abs(p);
	vec3 m = max(s - q, 0.0);
	float ret;
	ret = length(max(q - s, 0.0)) - min(min(m.x, m.y), m.z);
	return ret;
}

float crossBox(vec3 p, float s, float f)
{
	float ret;
	float m1 = cube(p, vec3(s, s, 99999.0));
	float m2 = cube(p, vec3(99999.0, s, s));
	float m3 = cube(p, vec3(s, 99999.0, s));

	ret = min(min(m1, m2), m3);
	ret *= f;

	return ret;
}

float dist(vec3 p, float f)
{
	float ret;
	p.xy  *= rot(uTime * 0.2);
	p.z += uTime;
	for (int i = 0; i < 4; i++)
	{
		p = abs(p) - 1.0;
		p.xz *= rot(0.3);
	}

	float k = 0.6;
	p = mod(p, k) - 0.5 * k;

	ret = min(crossBox(p, 0.02, f), cube(p, vec3(0.1)));

	return ret;
}

vec3 col(vec2 p)
{
	vec2 q = p;
	//q *= circ(vec2(sin(p.y) / p.x)) / sinc(perlin(p, cosc(uFreq)));
	q *= rot(1.0 - min(uTime, 1.0) + uTime);

	float f = abs(uFreq + uLastFreq / mod(uTime, 1.0)) * mod(sin(uTime), 0.5);
	float ff = fract(fract(f * 100.0) + fract(f * 10.0)) + (fract(f / f) * 10.0); 

	q = (q - 0.5) * 2.0;
	q.x *= uRes.x / uRes.y;
	
	//q *= rot(uTime * 0.2);
	q *= rot(uTime * ff);

	vec3 ro = vec3(cos(uTime), vec2(length(p + f)) * rot(f));
	vec3 rd = normalize(vec3(p, 0.0) - ro);

	float d, t = 2.0;

	float ac = mod(0.5 / uTime, 1.0) * ff; //0.0  // on to something

	for (int i = 0; i < 66; i++)
	{
		d = dist(ro + rd * t, mod(fract(f * 10000.0) * 10.0, sin(uTime) / cos(uTime)));
		t += d;
		ac += exp(-4.0 * d) * f;
		if (d < 0.01)
			break;
	}

	float cl = exp(-1.0 * t);

	float a = sinc(ff);
	float b = perlin(q, ff);
	float y = min(cosc(ff), perlin(p, ff));

	vec3 c;
	//c = vec3(0.7, 0.7, 0.2) * 0.05 * vec3(ac);
	c = vec3(
		max(min(a, b), y),
		0.1 * hash(1.0 / q, max(0.1, ff)), 
		y
	);
	//c += vec3(0.0, 0.3, 0.3);
	c += pow(c / f, vec3(0.7));
	if (d < 0.01)
		c += vec3(0.4, 0.8, 0.9) * 0.01 / abs(mod((ro + rd * t).z, 1.0) - 0.5);

		vec3 ret;
		//ret = vec3(1.0, 0.0, 0.0);
		//ret = vec3(0.0, 1.0, 0.0);
		//ret = vec3(0.0, 0.0, 1.0);

		ret = c;

		return ret;
	
}

void main()
{
	vec2 uv = (gl_FragCoord.xy / uRes.xy);
	uv.yx *= 1.5;
	uv.xy -= 1.5;

	vec4 ret;

	vec3 c = col(uv);
	float a = smoothstep(0.0, 0.1, min(min(c.r, c.g), c.b));

	ret = vec4(c, a);

	retColor = ret;
}